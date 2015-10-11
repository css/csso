var translate = require('../utils/translate');
var constants = require('./const');
var rules = require('./rules');
var TRBL = require('./trbl');

function CSSOCompressor() {
    this.props = {};
    this.shorts = {};
    this.shorts2 = {};

    this.shortGroupID = 0;
    this.lastShortGroupID = 0;
    this.lastShortSelector = 0;
}

CSSOCompressor.prototype.process = function(rules, token, container, idx, path) {
    var type = token[1];
    var rule = rules[type];
    var result;

    if (rule) {
        result = token;

        for (var i = 0; i < rule.length; i++) {
            var tmp = this[rule[i]](result, type, container, idx, path);

            if (tmp === null) {
                return null;
            }
            
            if (tmp !== undefined) {
                result = tmp;
            }
        }
    }

    return result;
};

CSSOCompressor.prototype.injectInfo = function(token) {
    for (var i = token.length - 1; i > -1; i--) {
        var child = token[i];

        if (Array.isArray(child)) {
            this.injectInfo(child);
            child.unshift({});
        }
    }
};

CSSOCompressor.prototype.findProtectedComment = function(tree) {
    for (var i = 2; i < tree.length; i++) {
        var token = tree[i];

        if (token[1] === 'comment' &&
            token[2].charAt(0) === '!') {
            return token;
        }

        if (token[1] !== 's') {
            return;
        }
    }
};

CSSOCompressor.prototype.compress = function(ast, options) {
    this.debug = Boolean(options.debug);

    ast = ast || ['stylesheet'];

    if (typeof ast[0] === 'string') {
        this.injectInfo([ast]);
    }

    var protectedComment = this.findProtectedComment(ast);

    // compression without restructure
    ast = this.walk(rules.cleanComments, ast, '/0', 'cleanComments');
    ast = this.walk(rules.compress, ast, '/0', 'compress');
    ast = this.walk(rules.prepare, ast, '/0', 'prepare');
    ast = this.walk(rules.freezeRuleset, ast, '/0', 'freezeRuleset');

    // restructure
    if (options.restructuring || options.restructuring === undefined) {
        var initAst = this.copyArray(ast);
        var initLength = translate(initAst, true).length;

        ast = this.walk(rules.rejoinRuleset, ast, '/0', 'rejoinRuleset');
        this.disjoin(ast);
        ast = this.walk(rules.markShorthand, ast, '/0', 'markShorthand');
        ast = this.walk(rules.cleanShortcut, ast, '/0', 'cleanShortcut');
        ast = this.walk(rules.restructureBlock, ast, '/0', 'restructureBlock');

        var curLength = Infinity;
        var minLength;
        var astSnapshot;
        do {
            minLength = curLength;
            astSnapshot = this.copyArray(ast);
            ast = this.walk(rules.rejoinRuleset, ast, '/0', 'rejoinRuleset');
            ast = this.walk(rules.restructureRuleset, ast, '/0', 'restructureRuleset');
            curLength = translate(ast, true).length;
        } while (minLength > curLength);

        if (initLength < minLength && initLength < curLength) {
            ast = initAst;
        } else if (minLength < curLength) {
            ast = astSnapshot;
        }
    }

    ast = this.walk(rules.finalize, ast, '/0');

    if (protectedComment) {
        ast.splice(2, 0, protectedComment);
    }

    return ast;
};

CSSOCompressor.prototype.disjoin = function(token) {
    for (var i = token.length - 1; i >= 2; i--) {
        var child = token[i];

        if (child && child[1] === 'ruleset') {
            var selector = child[2];

            child[0].shortGroupID = this.shortGroupID++;

            // there are more than 1 simple selector split for rulesets
            if (selector.length > 3) {
                // generate new rule sets:
                // .a, .b { color: red; }
                // ->
                // .a { color: red; }
                // .b { color: red; }
                for (var j = selector.length - 1; j >= 2; j--) {
                    var selectorInfo = this.copyObject(selector[0]);
                    var newRuleset = [
                      this.copyObject(child[0]),
                      'ruleset',
                      [selectorInfo, 'selector', selector[j]],
                      this.copyArray(child[3])
                    ];

                    selectorInfo.s = selector[j][0].s;
                    token.splice(i + 1, 0, newRuleset);
                }

                // delete old ruleset
                token.splice(i, 1);
            }
        }

        // Q: is it really needed? for rules in atrule block?
        // if (child.some(Array.isArray)) {
        //     this.disjoin(child);
        // }
    }

    if (this.debug) {
        console.log('disjoin\n  ' + translate(token, true).trim());
        console.log('');
    }
};

CSSOCompressor.prototype.walk = function(rules, token, path, name) {
    for (var i = token.length - 1; i >= 2; i--) {
        var child = token[i];

        if (Array.isArray(child)) {
            child = this.walk(rules, child, path + '/' + i); // go inside

            if (child === null) {
                token.splice(i, 1);
            } else {
                child = this.process(rules, child, token, i, path)
                if (child) {
                    // compressed not null
                    token[i] = child;
                } else if (child === null) {
                    // null is the mark to delete token
                    token.splice(i, 1);
                }
            }
        }
    }

    if (this.debug && name) {
        console.log(name + '\n  ' + translate(token, true).trim());
        console.log('');
    }

    return token.length ? token : null;
};

CSSOCompressor.prototype.freezeRulesets = function(token) {
    var info = token[0];
    var selector = token[2];

    info.freeze = this.freezeNeeded(selector);
    info.freezeID = this.selectorSignature(selector);
    info.pseudoID = this.composePseudoID(selector);
    info.pseudoSignature = this.pseudoSelectorSignature(selector, constants.allowedPClasses, true);
    this.markSimplePseudo(selector);

    return token;
};

CSSOCompressor.prototype.markSimplePseudo = function(selector) {
    var hash = {};

    for (var i = 2; i < selector.length; i++) {
        var simpleSelector = selector[i];

        simpleSelector[0].pseudo = this.containsPseudo(simpleSelector);
        simpleSelector[0].sg = hash;
        hash[simpleSelector[0].s] = 1;
    }
};

CSSOCompressor.prototype.composePseudoID = function(selector) {
    var pseudos = [];

    for (var i = 2; i < selector.length; i++) {
        var simpleSelector = selector[i];

        if (this.containsPseudo(simpleSelector)) {
            pseudos.push(simpleSelector[0].s);
        }
    }

    return pseudos.sort().join(',');
};

CSSOCompressor.prototype.containsPseudo = function(sselector) {
    for (var j = 2; j < sselector.length; j++) {
        switch (sselector[j][1]) {
            case 'pseudoc':
            case 'pseudoe':
            case 'nthselector':
                if (sselector[j][2][2] in constants.notFPClasses === false) {
                    return true;
                }
        }
    }
};

CSSOCompressor.prototype.selectorSignature = function(selector) {
    var parts = [];

    for (var i = 2; i < selector.length; i++) {
        parts.push(translate(selector[i], true));
    }

    return parts.sort().join(',');
};

CSSOCompressor.prototype.pseudoSelectorSignature = function(selector, exclude, dontAppendExcludeMark) {
    var pseudos = {};
    var wasExclude = false;

    exclude = exclude || {};

    for (var i = 2; i < selector.length; i++) {
        var simpleSelector = selector[i];

        for (var j = 2; j < simpleSelector.length; j++) {
            switch (simpleSelector[j][1]) {
                case 'pseudoc':
                case 'pseudoe':
                case 'nthselector':
                    if (!exclude.hasOwnProperty(simpleSelector[j][2][2])) {
                        pseudos[simpleSelector[j][2][2]] = 1;
                    } else {
                        wasExclude = true;
                    }
                    break;
            }
        }
    }

    return Object.keys(pseudos).sort().join(',') + (dontAppendExcludeMark ? '' : wasExclude);
};

CSSOCompressor.prototype.freezeNeeded = function(selector) {
    for (var i = 2; i < selector.length; i++) {
        var simpleSelector = selector[i];

        for (var j = 2; j < simpleSelector.length; j++) {
            switch (simpleSelector[j][1]) {
                case 'pseudoc':
                    if (!(simpleSelector[j][2][2] in constants.notFPClasses)) {
                        return true;
                    }
                    break;

                case 'pseudoe':
                    if (!(simpleSelector[j][2][2] in constants.notFPElements)) {
                        return true;
                    }
                    break;

                case 'nthselector':
                    return true;
            }
        }
    }

    return false;
};

CSSOCompressor.prototype.cleanCharset = function(token, rule, parent, i) {
    if (token[2][2][2] === 'charset') {
        for (i = i - 1; i > 1; i--) {
            if (parent[i][1] !== 's' && parent[i][1] !== 'comment') {
                return null;
            }
        }
    }
};

CSSOCompressor.prototype.cleanImport = function(token, rule, parent, i) {
    for (i = i - 1; i > 1; i--) {
        var type = parent[i][1];

        if (type !== 's' && type !== 'comment') {
            if (type === 'atrules') {
                var atrule = parent[i][2][2][2];
                
                if (atrule !== 'import' && atrule !== 'charset') {
                    return null;
                }
            } else {
                return null;
            }
        }
    }
};

CSSOCompressor.prototype.cleanComment = function(token, rule, parent, i) {
    var prevType = (parent[1] === 'braces' && i === 4) ||
                   (parent[1] !== 'braces' && i === 2) ? null : parent[i - 1][1];
    var nextType = i === parent.length - 1 ? null : parent[i + 1][1];

    if (nextType !== null && prevType !== null) {
        if (this._cleanComment(nextType) || this._cleanComment(prevType)) {
            return null;
        }
    }

    return null;
};

CSSOCompressor.prototype._cleanComment = function(r) {
    switch (r) {
        case 's':
        case 'operator':
        case 'attrselector':
        case 'block':
        case 'decldelim':
        case 'ruleset':
        case 'declaration':
        case 'atruleb':
        case 'atrules':
        case 'atruler':
        case 'important':
        case 'nth':
        case 'combinator':
            return true;
    }
};

CSSOCompressor.prototype.nextToken = function(parent, type, i, exactly) {
    for (; i < parent.length; i++) {
        var child = parent[i];

        if (Array.isArray(child)) {
            var childType = child[1];
            if (childType === type) {
                return child;
            } else if (exactly && childType !== 's') {
                return;
            }
        }
    }
};

CSSOCompressor.prototype.cleanWhitespace = function(token, rule, parent, i) {
    var prevType = (parent[1] === 'braces' && i === 4) ||
                   (parent[1] !== 'braces' && i === 2) ? null : parent[i - 1][1];
    var nextType = i === parent.length - 1 ? null : parent[i + 1][1];

    if (nextType === 'unknown') {
        token[2] = '\n';
    } else {
        if ((parent[1] !== 'atrulerq' || prevType) &&
            !this.issue16(prevType, nextType) &&
            !this.issue165(parent, prevType, nextType) &&
            !this.issue134(prevType, nextType)) {

            if (nextType !== null && prevType !== null) {
                if (this._cleanWhitespace(nextType, false) ||
                    this._cleanWhitespace(prevType, true)) {
                    return null;
                }
            } else {
                return null;
            }
        }

        token[2] = ' ';
    }

    return token;
};

// See https://github.com/afelix/csso/issues/16
CSSOCompressor.prototype.issue16 = function(prevType, nextType) {
    return nextType && prevType === 'uri';
};

//See https://github.com/css/csso/issues/165
CSSOCompressor.prototype.issue165 = function(container, prevType, nextType) {
    return container[1] === 'atrulerq' && prevType === 'braces' && nextType === 'ident';
};

//See https://github.com/css/csso/issues/134
CSSOCompressor.prototype.issue134 = function(prevType, nextType) {
    return prevType === 'funktion' && (nextType === 'funktion' || nextType === 'vhash');
};

CSSOCompressor.prototype._cleanWhitespace = function(type, left) {
    switch (type) {
        case 's':
        case 'operator':
        case 'attrselector':
        case 'block':
        case 'decldelim':
        case 'ruleset':
        case 'declaration':
        case 'atruleb':
        case 'atrules':
        case 'atruler':
        case 'important':
        case 'nth':
        case 'combinator':
            return true;
    }

    if (left) {
        switch (type) {
            case 'funktion':
            case 'braces':
            case 'uri':
                return true;
        }
    }
};

CSSOCompressor.prototype.cleanDecldelim = function(token) {
    for (var i = token.length - 1; i > 1; i--) {
        var type = token[i][1];
        var nextType = token[i + 1][1];

        if (type === 'decldelim' && nextType !== 'declaration') {
            token.splice(i, 1);
        }
    }

    if (token[2][1] === 'decldelim') {
        token.splice(2, 1);
    }

    return token;
};

function packNumber(value) {
    value = value 
        .replace(/^0+/, '')
        .replace(/\.0*$/, '')
        .replace(/(\..*\d+)0+$/, '$1');

    return value === '.' || value === '' ? '0' : value;
}

CSSOCompressor.prototype.compressNumber = function(token) {
    var value = packNumber(token[2]);

    token[2] = value;
    token[0].s = value;

    return token;
};

CSSOCompressor.prototype.cleanUnary = function(token, rule, parent, i) {
    var next = parent[i + 1];

    if (next && next[1] === 'number' && next[2] === '0') {
        return null;
    }

    return token;
};

CSSOCompressor.prototype.compressColor = function(token, rule, parent, i) {
    switch (rule) {
        case 'vhash':
            return this.compressHashColor(token);

        case 'funktion':
            return this.compressFunctionColor(token, rule, parent, i);

        case 'ident':
            return this.compressIdentColor(token, rule, parent, i);
    }
};

CSSOCompressor.prototype.compressIdentColor = function(token, rule, parent) {
    var parentType = parent[1];

    if (parentType === 'value' || parentType === 'functionBody') {
        var color = token[2].toLowerCase();
        var hex = constants.colorNameToHex[color];

        if (hex) {
            if (hex.length + 1 <= color.length) {
                // replace for shorter hex value
                return [{}, 'vhash', hex];
            } else {
                // special case for consistent colors
                if (color === 'grey') {
                    color = 'gray';
                }

                // just replace value for lower cased name
                token[2] = color;
            }
        }
    }
};

CSSOCompressor.prototype.compressHashColor = function(token) {
    return this._compressHashColor(token[2], token[0]);
};

CSSOCompressor.prototype._compressHashColor = function(color, info) {
    var minColor = color.toLowerCase();

    if (color.length === 6 &&
        color[0] === color[1] &&
        color[2] === color[3] &&
        color[4] === color[5]) {
        minColor = color[0] + color[2] + color[4];
    }

    if (constants.colorHexToName[minColor]) {
        return [info, 'ident', constants.colorHexToName[minColor]];
    }

    return [info, 'vhash', minColor];
};

CSSOCompressor.prototype.compressFunctionColor = function(token, rule, parent, idx) {
    function toHex(value) {
        value = value.toString(16);
        return value.length === 1 ? '0' + value : value;
    }

    function parseArgs(body, count) {
        var args = [];
        var hasNumber = false;
        var hasPercentage = false;

        for (var i = 2, unary = false; i < body.length; i++) {
            var child = body[i];
            var type = child[1];
            var num;

            switch (type) {
                case 'number':
                case 'percentage':
                    // fit value to 0..255 range
                    args.push({
                        type: type,
                        unary: unary,
                        value: Number(type === 'number' ? body[i][2] : body[i][2][2])
                    });
                    break;

                case 'unary':
                    if (child[2] === '+' || child[2] === '-') {
                        unary = child[2];
                        break;
                    }
                    // only + and - allowed
                    return;

                case 'operator':
                    if (child[2] === ',') {
                        unary = false;
                        break;
                    }
                    // only comma operator allowed
                    return;

                default:
                    // something we couldn't understand
                    return;
            }
        }

        if (args.length !== count) {
            // invalid arguments count
            // TODO: remove those tokens
            return;
        }

        if (args.length === 4 && args[3].type !== 'number') {
            // 4th argument should be a number
            // TODO: remove those tokens
            return;
        }

        if (args[0].type !== args[1].type || args[0].type !== args[2].type) {
            // invalid color, numbers and percentage shouldn't be mixed
            // TODO: remove those tokens
            return;
        }

        return args.map(function(arg, idx) {
            var value = arg.unary === '-' ? 0 : arg.value;

            // 4th argument is alpha in 0..1 range
            if (idx === 3) {
                return Math.min(value, 1);
            }

            if (arg.type === 'number') {
                value = Math.min(value, 255);
            } else {
                value = 255 * Math.min(value, 100) / 100;
            }

            return Math.round(value);
        });
    }

    var functionName = token[2][2];
    var body = token[3];
    var args;

    if (functionName === 'rgba') {
        args = parseArgs(body, 4);

        if (!args) {
            // something went wrong
            return;
        }

        if (args[3] !== 1) {
            // replace argument values for normalized/interpolated
            token[3] = body.filter(function(argToken, idx) {
                // ignore body's info and type
                if (idx < 2) {
                    return true;
                }

                var type = argToken[1];

                if (type === 'number' || type === 'percentage') {
                    var number = packNumber(String(args.shift()));
                    argToken[0].s = number;
                    argToken[1] = 'number';
                    argToken[2] = number;
                    return true;
                }

                return type === 'operator';
            });

            return;
        }

        // otherwise convert to rgb, i.e. rgba(255, 0, 0, 1) -> rgb(255, 0, 0)
        functionName = 'rgb';
    }

    if (functionName === 'rgb') {
        args = args || parseArgs(body, 3);

        if (!args) {
            // something went wrong
            return;
        }

        var color = toHex(args[0]) + toHex(args[1]) + toHex(args[2]);
        var vhash = this._compressHashColor(color, {});
        var next = parent[idx + 1];

        // check if color is not at the end and not followed by space
        if (next && next[1] != 's') {
            parent.splice(idx + 1, 0, [{}, 's', ' ']);
        }

        return vhash;
    }
};

CSSOCompressor.prototype.compressDimension = function(token) {
    var value = token[2][2];
    var unit = token[3][2];

    if (value === '0' && !constants.nonLengthUnits[unit]) {
        return token[2];
    }
};

CSSOCompressor.prototype.compressString = function(token) {
    // remove escaped \n, i.e.
    // .a { content: "foo\
    // bar"}
    // ->
    // .a { content: "foobar" }
    token[2] = token[2].replace(/\\\n/g, '');
};

CSSOCompressor.prototype.compressFontWeight = function(token) {
    var property = token[2];
    var value = token[3];

    if (/font-weight$/.test(property[2][2]) && value[2][1] === 'ident') {
        switch (value[2][2]) {
            case 'normal':
                value[2] = [{}, 'number', '400'];
                break;
            case 'bold':
                value[2] = [{}, 'number', '700'];
                break;
        }
    }
};

CSSOCompressor.prototype.compressFont = function(token) {
    var property = token[2];
    var value = token[3];

    if (/font$/.test(property[2][2]) && value.length) {
        value.splice(2, 0, [{}, 's', '']);

        for (var i = value.length - 1; i > 2; i--) {
            if (value[i][1] === 'ident') {
                var ident = value[i][2];
                if (ident === 'bold') {
                    value[i] = [{}, 'number', '700'];
                } else if (ident === 'normal') {
                    var t = value[i - 1];

                    if (t[1] === 'operator' && t[2] === '/') {
                        value.splice(--i, 2);
                    } else {
                        value.splice(i, 1);
                    }

                    if (value[i - 1][1] === 's') {
                        value.splice(--i, 1);
                    }
                } else if (ident === 'medium' && value[i + 1] && value[i + 1][2] !== '/') {
                    value.splice(i, 1);
                    if (value[i - 1][1] === 's') {
                        value.splice(--i, 1);
                    }
                }
            }
        }

        if (value.length > 2 && value[2][1] === 's') {
            value.splice(2, 1);
        }

        if (value.length === 2) {
            value.push([{}, 'ident', 'normal']);
        }

        return token;
    }
};

CSSOCompressor.prototype.compressBackground = function(token) {
    var property = token[2];
    var value = token[3];
    var n = value[value.length - 1][1] === 'important' ? 3 : 2;

    if (/background$/.test(property[2][2]) && value.length) {
        value.splice(2, 0, [{}, 's', '']);

        for (var i = value.length - 1; i > n; i--) {
            if (value[i][1] === 'ident') {
                var ident = value[i][2];

                if (ident === 'transparent' ||
                    ident === 'none' ||
                    ident === 'repeat' ||
                    ident === 'scroll') {
                    value.splice(i, 1);

                    if (value[i - 1][1] === 's') {
                        value.splice(--i, 1);
                    }
                }
            }
        }

        if (value.length > 2 && value[2][1] === 's') {
            value.splice(2, 1);
        }

        if (value.length === 2) {
            value.splice(2, 0,
                [{}, 'number', '0'],
                [{}, 's', ' '],
                [{}, 'number', '0']
            );
        }

        return token;
    }
};

CSSOCompressor.prototype.cleanEmpty = function(token, rule) {
    switch (rule) {
        case 'ruleset':
            if (token[3].length === 2) {
                return null;
            }
            break;

        case 'atruleb':
            if (token[token.length - 1].length < 3) {
                return null;
            }
            break;

        case 'atruler':
            if (token[4].length < 3) {
                return null;
            }
            break;
    }
};

CSSOCompressor.prototype.destroyDelims = function() {
    return null;
};

CSSOCompressor.prototype.preTranslate = function(token) {
    token[0].s = translate(token, true);
    return token;
};

CSSOCompressor.prototype.markShorthands = function(token, rule, parent, j, path) {
    var selector = '';
    var freeze = false;
    var freezeID = 'fake';
    var shortGroupID = parent[0].shortGroupID;
    var pre;
    var sh;

    if (parent[1] === 'ruleset') {
        selector = parent[2][2][0].s,
        freeze = parent[0].freeze,
        freezeID = parent[0].freezeID;
    }

    pre = this.pathUp(path) + '/' + (freeze ? '&' + freezeID + '&' : '') + selector + '/';

    for (var i = token.length - 1; i > -1; i--) {
        var createNew = true;
        var child = token[i];

        if (child[1] === 'declaration') {
            var childInfo = child[0];
            var property = child[2][0].s;
            var value = child[3];
            var important = value[value.length - 1][1] === 'important';

            childInfo.id = path + '/' + i;

            if (property in TRBL.props) {
                var key = pre + TRBL.extractMain(property);
                var shorts = this.shorts2[key] || [];
                var shortsI = shorts.length === 0 ? 0 : shorts.length - 1;

                if (!this.lastShortSelector ||
                    selector === this.lastShortSelector ||
                    shortGroupID === this.lastShortGroupID) {
                    if (shorts.length) {
                        sh = shorts[shortsI];
                        createNew = false;
                    }
                }

                if (createNew) {
                    childInfo.replaceByShort = true;
                    childInfo.shorthandKey = { key: key, i: shortsI };
                    sh = new TRBL(property, important);
                    shorts.push(sh);
                }


                childInfo.removeByShort = true;
                childInfo.shorthandKey = { key: key, i: shortsI };
                sh.add(property, value[0].s, value.slice(2), important);

                this.shorts2[key] = shorts;

                this.lastShortSelector = selector;
                this.lastShortGroupID = shortGroupID;
            }
        }
    }

    return token;
};

CSSOCompressor.prototype.cleanShorthands = function(token) {
    var info = token[0];

    if (info.removeByShort || info.replaceByShort) {
        var sKey = info.shorthandKey;
        var shorthand = this.shorts2[sKey.key][sKey.i];

        if (shorthand.isOkToMinimize()) {
            if (info.replaceByShort) {
                var shorterToken  = [{}, 'declaration', shorthand.getProperty(), shorthand.getValue()];
                shorterToken[0].s = translate(shorterToken, true);
                return shorterToken;
            } else {
                return null;
            }
        }
    }
};

CSSOCompressor.prototype.restructureBlock = function(token, rule, parent, j, path) {
    var props = {};
    var isPseudo = false;
    var selector = '';
    var freeze = false;
    var freezeID = 'fake';
    var pseudoID = 'fake';
    var sg = {};

    if (parent[1] === 'ruleset') {
        var parentInfo = parent[0];
        var parentSelectorInfo = parent[2][2][0];

        props = this.props;
        isPseudo = parentSelectorInfo.pseudo;
        selector = parentSelectorInfo.s;
        freeze = parentInfo.freeze;
        freezeID = parentInfo.freezeID;
        pseudoID = parentInfo.pseudoID;
        sg = parentSelectorInfo.sg;
    }

    for (var i = token.length - 1; i > -1; i--) {
        var child = token[i];

        if (child[1] === 'declaration') {
            var value = child[3];
            var important = value[value.length - 1][1] === 'important';
            var property = child[2][0].s;
            var pre = this.pathUp(path) + '/' + selector + '/';
            var ppre = this.buildPPre(pre, property, value, child, freeze);
            var ppreProps = props[ppre];
            var id = path + '/' + i;

            child[0].id = id;

            if (!constants.dontRestructure[property] && ppreProps) {
                if ((isPseudo && freezeID === ppreProps.freezeID) || // pseudo from equal selectors group
                    (!isPseudo && pseudoID === ppreProps.pseudoID) || // not pseudo from equal pseudo signature group
                    (isPseudo && pseudoID === ppreProps.pseudoID && this.hashInHash(sg, ppreProps.sg))) { // pseudo from covered selectors group
                    if (important && !ppreProps.important) {
                        props[ppre] = {
                            block: token,
                            important: important,
                            id: id,
                            sg: sg,
                            freeze: freeze,
                            path: path,
                            freezeID: freezeID,
                            pseudoID: pseudoID
                        };

                        this.deleteProperty(ppreProps.block, ppreProps.id);
                    } else {
                        token.splice(i, 1);
                    }
                }
            } else if (this.needless(property, props, pre, important, value, child, freeze)) {
                token.splice(i, 1);
            } else {
                props[ppre] = {
                    block: token,
                    important: important,
                    id: id,
                    sg: sg,
                    freeze: freeze,
                    path: path,
                    freezeID: freezeID,
                    pseudoID: pseudoID
                };
            }
        }
    }
    return token;
};

CSSOCompressor.prototype.buildPPre = function(pre, property, value, d, freeze) {
    var fp = freeze ? 'ft:' : 'ff:';

    if (property.indexOf('background') !== -1) {
        return fp + pre + d[0].s;
    }

    var vendorId = '';
    var colorMark = [
            0, // ident, vhash, rgb
            0, // hsl
            0, // hsla
            0  // rgba
        ];

    for (var i = 2; i < value.length; i++) {
        if (!vendorId) {
            vendorId = this.getVendorIDFromToken(value[i]);
        }

        switch (value[i][1]) {
            case 'vhash':
            case 'ident':
                colorMark[0] = 1;
                break;

            case 'funktion':
                switch(value[i][2][2]) {
                    case 'rgb':
                        colorMark[0] = 1;
                        break;

                    case 'hsl':
                        colorMark[1] = 1;
                        break;

                    case 'hsla':
                        colorMark[2] = 1;
                        break;

                    case 'rgba':
                        colorMark[3] = 1;
                        break;
                }
                break;
        }
    }

    return fp + pre + property + colorMark.join('') + vendorId;
};

CSSOCompressor.prototype.getVendorIDFromToken = function(token) {
    var vendorId;

    switch (token[1]) {
        case 'ident':
            vendorId = this.getVendorFromString(token[2]);
            break;

        case 'funktion':
            vendorId = this.getVendorFromString(token[2][2]);
            break;
    }

    if (vendorId) {
        return constants.vendorID[vendorId] || '';
    }

    return '';
};

CSSOCompressor.prototype.getVendorFromString = function(string) {
    if (string[0] === '-') {
        var secondDashIndex = string.indexOf('-', 2);
        if (secondDashIndex !== -1) {
            return string.substr(0, secondDashIndex + 1);
        }
    }

    return '';
};

CSSOCompressor.prototype.deleteProperty = function(block, id) {
    for (var i = block.length - 1; i > 1; i--) {
        var child = block[i];
        
        if (Array.isArray(child) &&
            child[1] === 'declaration' &&
            child[0].id === id) {
            block.splice(i, 1);
            return;
        }
    }
};

CSSOCompressor.prototype.needless = function(name, props, pre, important, v, d, freeze) {
    var hack = name[0];

    if (hack === '*' || hack === '_' || hack === '$') {
        name = name.substr(1);
    } else if (hack === '/' && name[1] === '/') {
        hack = '//';
        name = name.substr(2);
    } else {
        hack = '';
    }

    var vendor = this.getVendorFromString(name);
    var table = constants.nlTable[name.substr(vendor.length)];

    if (table) {
        for (var i = 0; i < table.length; i++) {
            var ppre = this.buildPPre(pre, hack + vendor + table[i], v, d, freeze);
            var property = props[ppre];
            
            if (property) {
                return (!important || property.important);
            }
        }
    }
};

CSSOCompressor.prototype.rejoinRuleset = function(token, rule, container, i) {
    var prev = i === 2 || container[i - 1][1] === 'unknown' ? null : container[i - 1];
    var prevSelector = prev ? prev[2] : [];
    var prevBlock = prev ? prev[3] : [];
    var selector = token[2];
    var block = token[3];

    if (block.length === 2) {
        return null;
    }

    if (prevSelector.length > 2 &&
        prevBlock.length > 2 &&
        token[0].pseudoSignature == prev[0].pseudoSignature) {
        if (token[1] !== prev[1]) {
            return;
        }

        // try to join by selectors
        var prevHash = this.getHash(prevSelector);
        var hash = this.getHash(selector);

        if (this.equalHash(hash, prevHash)) {
            prev[3] = prev[3].concat(token[3].splice(2));
            return null;
        }
        if (this.okToJoinByProperties(token, prev)) {
            // try to join by properties
            var r = this.analyze(token, prev);
            if (!r.ne1.length && !r.ne2.length) {
                prev[2] = this.cleanSelector(prev[2].concat(token[2].splice(2)));
                prev[2][0].s = translate(prev[2], true);
                return null;
            }
        }
    }
};

CSSOCompressor.prototype.okToJoinByProperties = function(token1, token2) {
    var info1 = token1[0];
    var info2 = token2[0];

    // same frozen ruleset
    if (info1.freezeID === info2.freezeID) {
        return true;
    }

    // same pseudo-classes in selectors
    if (info1.pseudoID === info2.pseudoID) {
        return true;
    }

    // different frozen rulesets
    if (info1.freeze && info2.freeze) {
        var signature1 = this.pseudoSelectorSignature(token1[2], constants.allowedPClasses);
        var signature2 = this.pseudoSelectorSignature(token2[2], constants.allowedPClasses)

        return signature1 === signature2;
    }

    // is it frozen at all?
    return !info1.freeze && !info2.freeze;
};

CSSOCompressor.prototype.containsOnlyAllowedPClasses = function(selector) {
    for (var i = 2; i < selector.length; i++) {
        var simpleSelector = selector[i];

        for (var j = 2; j < simpleSelector.length; j++) {
            if (simpleSelector[j][1] == 'pseudoc' ||
                simpleSelector[j][1] == 'pseudoe') {
                if (!constants.allowedPClasses[simpleSelector[j][2][2]]) {
                    return false;
                }
            }
        }
    }

    return true;
};

CSSOCompressor.prototype.restructureRuleset = function(token, rule, parent, i) {
    var prevToken = (i === 2 || parent[i - 1][1] === 'unknown') ? null : parent[i - 1];
    var prevSelector = prevToken ? prevToken[2] : [];
    var prevBlock = prevToken ? prevToken[3] : [];
    var selector = token[2];
    var block = token[3];

    if (block.length < 3) {
        return null;
    }

    if (prevSelector.length > 2 &&
        prevBlock.length > 2 &&
        token[0].pseudoSignature == prevToken[0].pseudoSignature) {
        if (token[1] !== prevToken[1]) {
            return;
        }

        // try to join by properties
        var analyzeInfo = this.analyze(token, prevToken);

        if (analyzeInfo.eq.length && (analyzeInfo.ne1.length || analyzeInfo.ne2.length)) {
            if (analyzeInfo.ne1.length && !analyzeInfo.ne2.length) {
                // prevToken in token
                var simpleSelectorCount = selector.length - 2; // - type and info
                var selectorStr = translate(selector, true);
                var selectorLength = selectorStr.length +
                                     simpleSelectorCount - 1; // delims count
                var blockLength = this.calcLength(analyzeInfo.eq) + // declarations length
                                  analyzeInfo.eq.length - 1; // decldelims length

                if (selectorLength < blockLength) {
                    prevToken[2] = this.cleanSelector(prevSelector.concat(selector.slice(2)));
                    token[3] = [block[0], block[1]].concat(analyzeInfo.ne1);
                    return token;
                }
            } else if (analyzeInfo.ne2.length && !analyzeInfo.ne1.length) {
                // token in prevToken
                var simpleSelectorCount = prevSelector.length - 2; // - type and info
                var selectorStr = translate(prevSelector, true);
                // selectorLength = selector str - delims count
                var selectorLength = selectorStr.length + simpleSelectorCount - 1;
                var blockLength = this.calcLength(analyzeInfo.eq) + // declarations length
                                  analyzeInfo.eq.length - 1; // decldelims length

                if (selectorLength < blockLength) {
                    token[2] = this.cleanSelector(prevSelector.concat(selector.slice(2)));
                    prevToken[3] = [prevBlock[0], prevBlock[1]].concat(analyzeInfo.ne2);
                    return token;
                }
            } else {
                // extract equal block?
                var newSelector = this.cleanSelector(prevSelector.concat(selector.slice(2)));
                var newSelectorStr = translate(newSelector, true);
                var newSelectorLength = newSelectorStr.length + // selector length
                                        newSelector.length - 1 + // delims length
                                        2; // braces length
                var blockLength = this.calcLength(analyzeInfo.eq) + // declarations length
                                  analyzeInfo.eq.length - 1; // decldelims length

                // ok, it's good enough to extract
                if (blockLength >= newSelectorLength) {
                    var newRuleset = [
                        {f:0, l:0},
                        'ruleset',
                        newSelector,
                        [{f:0,l:0}, 'block'].concat(analyzeInfo.eq)
                    ];

                    newSelector[0].s = newSelectorStr;
                    token[3] = [block[0], block[1]].concat(analyzeInfo.ne1);
                    prevToken[3] = [prevBlock[0], prevBlock[1]].concat(analyzeInfo.ne2);
                    parent.splice(i, 0, newRuleset);
                    return newRuleset;
                }
            }
        }
    }
};

CSSOCompressor.prototype.calcLength = function(tokens) {
    var length = 0;

    for (var i = 0; i < tokens.length; i++) {
        length += tokens[i][0].s.length;
    };

    return length;
};

CSSOCompressor.prototype.cleanSelector = function(token) {
    if (token.length === 2) {
        return null;
    }

    var saw = {};

    for (var i = 2; i < token.length; i++) {
        var selector = token[i][0].s;
        if (saw.hasOwnProperty(selector)) {
            token.splice(i, 1);
            i--;
        } else {
            saw[selector] = true;
        }
    }

    return token;
};

CSSOCompressor.prototype.analyze = function(token1, token2) {
    var result = {
        eq: [],
        ne1: [],
        ne2: []
    };

    if (token1[1] !== token2[1]) {
        return result;
    }

    var items1 = token1[3];
    var items2 = token2[3];
    var hash1 = this.getHash(items1);
    var hash2 = this.getHash(items2);

    for (var i = 2; i < items1.length; i++) {
        var item = items1[i];

        if (item[0].s in hash2) {
            result.eq.push(item);
        } else {
            result.ne1.push(item);
        }
    }

    for (var i = 2; i < items2.length; i++) {
        var item = items2[i];

        if (item[0].s in hash1 === false) {
            result.ne2.push(item);
        }
    }

    return result;
};

CSSOCompressor.prototype.equalHash = function(h0, h1) {
    for (var key in h0) {
        if (key in h1 === false) {
            return false;
        }
    }
    
    for (var key in h1) {
        if (key in h0 === false) {
            return false;
        }
    }

    return true;
};

CSSOCompressor.prototype.getHash = function(tokens) {
    var hash = {};

    for (var i = 2; i < tokens.length; i++) {
        hash[tokens[i][0].s] = true;
    }

    return hash;
};

CSSOCompressor.prototype.hashInHash = function(hash1, hash2) {
    for (var key in hash1) {
        if (key in hash2 === false) {
            return false;
        }
    }

    return true;
};

CSSOCompressor.prototype.delimSelectors = function(token) {
    for (var i = token.length - 1; i > 2; i--) {
        token.splice(i, 0, [{}, 'delim']);
    }
};

CSSOCompressor.prototype.delimBlocks = function(token) {
    for (var i = token.length - 1; i > 2; i--) {
        token.splice(i, 0, [{}, 'decldelim']);
    }
};

CSSOCompressor.prototype.copyObject = function(obj) {
    var result = {};

    for (var key in obj) {
        result[key] = obj[key];
    }

    return result;
};

CSSOCompressor.prototype.copyArray = function(token) {
    var result = token.slice();
    var oldInfo = token[0];
    var newInfo = {};

    for (var key in oldInfo) {
        newInfo[key] = oldInfo[key];
    }

    result[0] = newInfo;

    for (var i = 2; i < token.length; i++) {
        if (Array.isArray(token[i])) {
            result[i] = this.copyArray(token[i]);
        }
    }

    return result;
};

CSSOCompressor.prototype.pathUp = function(path) {
    return path.substr(0, path.lastIndexOf('/'));
};

module.exports = function(tree, options) {
    return new CSSOCompressor().compress(tree, options || {});
};
