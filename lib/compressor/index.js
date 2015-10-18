var translate = require('../utils/translate');
var walker = require('../utils/walker');
var constants = require('./const');
var rules = require('./rules');
var TRBL = require('./trbl');
var utils = require('./utils');
var wrapAst = require('./ast/index');
var cleanFn = require('./clean');
var compressFn = require('./compress');
var debug;
var lastDebug;

function CSSOCompressor() {
    this.props = {};
    this.shorts = {};
    this.shorts2 = {};

    this.shortGroupID = 0;
    this.lastShortGroupID = 0;
    this.lastShortSelector = 0;
}

function injectInfo(token) {
    for (var i = token.length - 1; i > -1; i--) {
        var child = token[i];

        if (Array.isArray(child)) {
            injectInfo(child);
            child.unshift({});
        }
    }
};

function readBlock(stylesheet, offset) {
    var buffer = [];
    var nonSpaceTokenInBuffer = false;
    var protectedComment;

    for (var i = offset; i < stylesheet.length; i++) {
        var token = stylesheet[i];

        if (token[1] === 'comment' &&
            token[2].charAt(0) === '!') {
            if (nonSpaceTokenInBuffer || protectedComment) {
                break;
            }

            protectedComment = token;
            continue;
        }

        if (token[1] !== 's') {
            nonSpaceTokenInBuffer = true;
        }

        buffer.push(token);
    }

    return {
        comment: protectedComment,
        stylesheet: [{}, 'stylesheet'].concat(buffer),
        offset: i
    };
}

CSSOCompressor.prototype.process = function(rules, token, container, idx, path, stack) {
    var type = token[1];
    var rule = rules[type];
    var result;

    if (rule) {
        result = token;

        for (var i = 0; i < rule.length; i++) {
            var fn = rule[i];

            if (typeof fn === 'string') {
                fn = this[fn];
            }

            var tmp = fn.call(this, result, type, container, idx, path, stack);

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

CSSOCompressor.prototype.walk = function(rules, token, path, name, stack) {
    if (!stack) {
        stack = [token];
    }

    for (var i = token.length - 1; i >= 2; i--) {
        var child = token[i];

        if (Array.isArray(child)) {
            stack.push(child);
            child = this.walk(rules, child, path + '/' + i, null, stack); // go inside
            stack.pop();

            if (child === null) {
                token.splice(i, 1);
            } else {
                child = this.process(rules, child, token, i, path, stack);
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

    if (name) {
        debug(name, token);
    }

    return token.length ? token : null;
};

function debug_(name, token) {
    var line = name + (lastDebug ? ' (' + ((Date.now() - lastDebug) / 1000) + 'ms)' : '');

    if (0 && token) {
        line += '\n  ' + translate(token, true).trim() + '\n';
    }

    console.log(line);
    lastDebug = Date.now();
}

function walk(name, ast, fn) {
    ast.walk(fn);

    debug(name, ast.token);
}

function compressBlock(ast, restructuring, num) {
    debug('Compress block #' + num, ast);

    // compression without restructure
    var x = wrapAst(ast);
    debug('wrap AST');

    walk('clean comments', x, {
        comment: function(node) {
            node.remove();
        }
    });
    x.firstAtrulesAllowed = ast.firstAtrulesAllowed;

    walk('clean', x, cleanFn);
    walk('compress', x, compressFn);

    ast = this.walk(rules.prepare, ast, '/0', 'prepare');
    ast = this.walk(rules.freezeRuleset, ast, '/0', 'freezeRuleset');

    // structure optimisations
    if (restructuring) {
        var initAst = utils.copyArray(ast);
        var initLength = translate(initAst, true).length;

        ast = this.walk(rules.rejoinRuleset, ast, '/0', 'rejoinRuleset');
        this.disjoin(ast);
        debug('disjoin', ast);
        ast = this.walk(rules.markShorthand, ast, '/0', 'markShorthand');
        ast = this.walk(rules.cleanShortcut, ast, '/0', 'cleanShortcut');
        ast = this.walk(rules.restructureBlock, ast, '/0', 'restructureBlock');

        var curLength = Infinity;
        var minLength;
        var astSnapshot;
        do {
            minLength = curLength;
            astSnapshot = utils.copyArray(ast);
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

    return ast;
}

CSSOCompressor.prototype.compress = function(ast, options) {
    debug = Boolean(options.debug) ? debug_ : function() {};

    ast = ast || [{}, 'stylesheet'];

    if (typeof ast[0] === 'string') {
        injectInfo([ast]);
    }

    var result = [{}, 'stylesheet'];
    var block = { offset: 2 };
    var restructuring = options.restructuring || options.restructuring === undefined;
    var firstAtrulesAllowed = true;
    var blockNum = 1;

    do {
        block = readBlock(ast, block.offset);
        block.stylesheet.firstAtrulesAllowed = firstAtrulesAllowed;
        block.stylesheet = compressBlock.call(this, block.stylesheet, restructuring, blockNum);

        if (block.comment) {
            // add \n before comment if there is another content in result
            if (result.length > 2) {
                result.push([{}, 's', '\n']);
            }

            result.push(block.comment);

            // add \n after comment if block is not empty
            if (block.stylesheet.length > 2) {
                result.push([{}, 's', '\n']);
            }
        }

        result.push.apply(result, block.stylesheet.slice(2));

        if (firstAtrulesAllowed && result.length > 2) {
            for (var i = block.stylesheet.length - 1; i >= 2; i--) {
                var token = block.stylesheet[i];
                var type = token[1];

                if (type !== 's' && type !== 'comment') {
                    if (type === 'atrules') {
                        var atrule = token[2][2][2];

                        if (atrule === 'import' || atrule === 'charset') {
                            continue;
                        }
                    }

                    firstAtrulesAllowed = false;
                    break;
                }
            }
        }
    } while (block.offset < ast.length);

    return result;
};

CSSOCompressor.prototype.disjoin = function(token) {
    for (var i = token.length - 1; i >= 2; i--) {
        var child = token[i];

        if (!Array.isArray(child)) {
            continue;
        }

        if (child[1] === 'ruleset') {
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
                    var selectorInfo = utils.copyObject(selector[0]);
                    var newRuleset = [
                      utils.copyObject(child[0]),
                      'ruleset',
                      [selectorInfo, 'selector', selector[j]],
                      utils.copyArray(child[3])
                    ];

                    selectorInfo.s = selector[j][0].s;
                    token.splice(i + 1, 0, newRuleset);
                }

                // delete old ruleset
                token.splice(i, 1);
            }
        } else {
            // try disjoin nested stylesheets, i.e. @media, @support etc.
            this.disjoin(child);
        }
    }
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
                    if (simpleSelector[j][2][2] in constants.notFPClasses === false) {
                        return true;
                    }
                    break;

                case 'pseudoe':
                    if (simpleSelector[j][2][2] in constants.notFPElements === false) {
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

    pre = utils.pathUp(path) + '/' + (freeze ? '&' + freezeID + '&' : '') + selector + '/';

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

                if (!this.lastShortSelector ||
                    selector === this.lastShortSelector ||
                    shortGroupID === this.lastShortGroupID) {
                    if (shorts.length) {
                        sh = shorts[shorts.length - 1];
                        createNew = false;
                    }
                }

                if (createNew) {
                    sh = new TRBL(property, important);
                    shorts.push(sh);
                    childInfo.replaceByShort = true;
                } else {
                    childInfo.removeByShort = true;
                }

                childInfo.shorthandKey = { key: key, i: shorts.length - 1 };

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
            var pre = utils.pathUp(path) + '/' + selector + '/';
            var ppre = this.getPropertyFingerprint(pre, property, value, child, freeze);
            var ppreProps = props[ppre];
            var id = path + '/' + i;

            child[0].id = id;

            if (!constants.dontRestructure[property] && ppreProps) {
                if ((isPseudo && freezeID === ppreProps.freezeID) || // pseudo from equal selectors group
                    (!isPseudo && pseudoID === ppreProps.pseudoID) || // not pseudo from equal pseudo signature group
                    (isPseudo && pseudoID === ppreProps.pseudoID && utils.hashInHash(sg, ppreProps.sg))) { // pseudo from covered selectors group
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

CSSOCompressor.prototype.getPropertyFingerprint = function(pre, property, value, d, freeze) {
    var fp = freeze ? 'ft:' : 'ff:';

    if (property.indexOf('background') !== -1) {
        return fp + pre + d[0].s;
    }

    var vendorId = '';
    var hack9 = 0;
    var functions = {};
    var units = {};

    for (var i = 2; i < value.length; i++) {
        if (!vendorId) {
            vendorId = this.getVendorIDFromToken(value[i]);
        }

        switch (value[i][1]) {
            case 'ident':
                if (value[i][2] === '\\9') {
                    hack9 = 1;
                }
                break;

            case 'funktion':
                functions[value[i][2][2]] = true;
                break;

            case 'dimension':
                var unit = value[i][3][2];
                switch (unit) {
                    // is not supported until IE11
                    case 'rem':

                    // v* units is too buggy across browsers and better
                    // don't merge values with those units
                    case 'vw':
                    case 'vh':
                    case 'vmin':
                    case 'vmax':
                    case 'vm': // IE9 supporting "vm" instead of "vmin".
                        units[unit] = true;
                        break;

                    default:
                        // regular units
                        units.safe = true;
                }
                break;
        }
    }

    return (
        fp + pre + property +
        '[' + Object.keys(functions) + ']' +
        Object.keys(units) +
        hack9 + vendorId
    );
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
            var ppre = this.getPropertyFingerprint(pre, hack + vendor + table[i], v, d, freeze);
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
        var prevHash = utils.getHash(prevSelector);
        var hash = utils.getHash(selector);

        if (utils.equalHash(hash, prevHash)) {
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
        var signature2 = this.pseudoSelectorSignature(token2[2], constants.allowedPClasses);

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
                        {},
                        'ruleset',
                        newSelector,
                        [{}, 'block'].concat(analyzeInfo.eq)
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
    var hash1 = utils.getHash(items1);
    var hash2 = utils.getHash(items2);

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

module.exports = function(tree, options) {
    return new CSSOCompressor().compress(tree, options || {});
};
