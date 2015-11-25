var translate = require('../utils/translate');
var walker = require('../utils/walker');
var constants = require('./const');
var TRBL = require('./trbl');
var utils = require('./utils');
var wrapAst = require('./ast/index');
var cleanFn = require('./clean');
var compressFn = require('./compress');
var debug;
var lastDebug;

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

function walkBlocks(context, fn, token, path, name) {
    for (var i = token.length - 1; i >= 2; i--) {
        var child = token[i];

        if (Array.isArray(child)) {
            walkBlocks(context, fn, child, path + '/' + i); // go inside

            var type = child[1];

            if (type === 'block') {
                child = fn.call(context, child, type, token, i, path);
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
    var line = (lastDebug ? '(' + ((Date.now() - lastDebug) / 1000).toFixed(3) + 'ms) ' : '') + name;

    if (token) {
        var css = translate(token, true).trim();
        var max = 1000;
        // line += '\n  ' + (css.length > max ? css.substr(0, max) + '...' : css) + '\n';
    }

    console.log(line);
    lastDebug = Date.now();
}

function walk(name, ast, fn) {
    ast.walk(fn);

    debug(name, ast.token);
}

function walkRulesets(context, stylesheets, fn) {
    stylesheets.forEach(function(stylesheet, id) {
        for (var i = stylesheet.length - 1; i >= 2; i--) {
            var token = stylesheet[i];
            var result;

            if (token[1] === 'ruleset') {
                var result = fn.call(this, token, '', stylesheet, i);
                if (result === null) {
                    stylesheet.splice(i, 1);
                }
            }
        }
    }, context);
}

function compressBlock(ast, restructuring, num) {
    debug('Compress block #' + num, ast);

    var context = {
        props: {},
        shorts: {},
        shortDeclarations: [],
        lastShortSelector: 0
    };

    // compression without restructure
    var root = wrapAst(ast);
    root.firstAtrulesAllowed = ast.firstAtrulesAllowed;
    root.rulesetParents = new Set();
    debug('wrap AST');

    // to make analys simpler
    walk('clean comments', root, {
        comment: function(node) {
            node.remove();
        }
    });

    walk('clean', root, cleanFn);
    walk('compress', root, compressFn);

    // structure optimisations
    if (restructuring) {
        walk('prepare', root, require('./structure/prepare.js'));
        // sort selectors and remove duplicates
        // walk('selectors', root, {
        //     ruleset: function(node) {
        //         var selector = node.token[2];
        //         node.token[2] = [selector[0], selector[1]];
        //         addToSelector(node.token[2], selector);
        //     }
        // });

        walk('freeze', root, require('./structure/freeze.js'));

        // todo: remove
        walkRulesets(context, root.rulesetParents, rejoinRuleset);
        debug('rejoinRuleset', ast);

        disjoin(ast);
        debug('disjoin', ast);

        walkBlocks(context, markShorthands, ast, '', 'markShorthand');
        // walkRulesets(context, root.rulesetParents, context.markShorthands);
        // debug('markShorthand', ast);
        context.shortDeclarations.forEach(processShorthand);
        debug('processShorthand', ast);

        walkBlocks(context, restructureBlock, ast, '', 'restructureBlock');
        this.props = null;

        walkRulesets(context, root.rulesetParents, rejoinRuleset);
        debug('rejoinRuleset', ast);

        walkRulesets(context, root.rulesetParents, restructureRuleset);
        debug('restructureRuleset', ast);
    }

    // finalize
    walker(ast, function(token) {
        var type = token[1];

        if (type === 'selector') {
            for (var i = token.length - 1; i > 2; i--) {
                token.splice(i, 0, [{}, 'delim']);
            }
        } else if (type === 'block') {
            for (var i = token.length - 1; i > 2; i--) {
                token.splice(i, 0, [{}, 'decldelim']);
            }
        }
    }, true);
    debug('finalize');

    return ast;
}

function compress(ast, options) {
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
        block.stylesheet = compressBlock(block.stylesheet, restructuring, blockNum);

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

function disjoin(token) {
    for (var i = token.length - 1; i >= 2; i--) {
        var child = token[i];

        if (!Array.isArray(child)) {
            continue;
        }

        if (child[1] === 'ruleset') {
            var selector = child[2];

            // there are more than 1 simple selector split for rulesets
            if (selector.length > 3) {
                // generate new rule sets:
                // .a, .b { color: red; }
                // ->
                // .a { color: red; }
                // .b { color: red; }
                for (var j = selector.length - 1; j >= 2; j--) {
                    token.splice(i + 1, 0, [
                        utils.copyObject(child[0]),
                        'ruleset',
                        [
                            utils.copyObject(selector[0]),
                            'selector',
                            selector[j]
                        ],
                        utils.copyArray(child[3])
                    ]);
                }

                // delete old ruleset
                token.splice(i, 1);
            }
        } else {
            // try disjoin nested stylesheets, i.e. @media, @support etc.
            disjoin(child);
        }
    }
};

function markShorthands(token, rule, parent, j, path) {
    if (parent[1] !== 'ruleset') {
        return;
    }

    var selector = parent[2][2][0].s;
    var freeze = parent[0].freeze;
    var freezeID = parent[0].freezeID;
    var pre;

    for (var i = token.length - 1; i >= 2; i--) {
        var child = token[i];

        if (child[1] === 'declaration') {
            var childInfo = child[0];
            var property = child[2][0].s;
            var value = child[3];
            var important = value[value.length - 1][1] === 'important';

            if (property in TRBL.props) {
                if (!pre) {
                    pre = utils.pathUp(path) + '/' + (freeze ? '&' + freezeID + '&' : '') + selector + '/';
                }

                var key = pre + TRBL.extractMain(property);
                var shorthand = null;

                if (!this.lastShortSelector || selector === this.lastShortSelector) {
                    if (key in this.shorts) {
                        shorthand = this.shorts[key];
                        childInfo.removeByShort = true;
                    }
                }

                if (!shorthand) {
                    shorthand = new TRBL(property, important);
                    childInfo.replaceByShort = true;
                }

                shorthand.add(property, value[0].s, value.slice(2), important);

                childInfo.shorthandInfo = shorthand;
                this.shorts[key] = shorthand;
                this.shortDeclarations.push({
                    block: token,
                    declaration: child,
                    pos: i
                });

                this.lastShortSelector = selector;
            }
        }
    }
};

function processShorthand(item) {
    var info = item.declaration[0];

    if (info.removeByShort || info.replaceByShort) {
        var shorthand = info.shorthandInfo;

        if (shorthand.isOkToMinimize()) {
            if (info.replaceByShort) {
                var shorterToken  = [{}, 'declaration', shorthand.getProperty(), shorthand.getValue()];
                shorterToken[0].s = translate(shorterToken, true);
                item.block.splice(item.pos, 1, shorterToken);
            } else {
                item.block.splice(item.pos, 1);
            }
        }
    }
}

function restructureBlock(token, rule, parent, j, path) {
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
        selector = parentSelectorInfo.s;
        freeze = parentInfo.freeze;
        freezeID = parentInfo.freezeID;
        pseudoID = parentInfo.pseudoID;
        isPseudo = parentSelectorInfo.pseudo;
        sg = parentSelectorInfo.sg;
    }

    var pre = utils.pathUp(path) + '/' + selector;
    for (var i = token.length - 1; i > -1; i--) {
        var child = token[i];

        if (child[1] === 'declaration') {
            var value = child[3];
            var important = value[value.length - 1][1] === 'important';
            var property = child[2][0].s;
            var ppre = getPropertyFingerprint(pre, property, value, child, freeze);
            var ppreProps = props[ppre];

            if (!constants.dontRestructure[property] && ppreProps) {
                if ((isPseudo && freezeID === ppreProps.freezeID) || // pseudo from equal selectors group
                    (!isPseudo && pseudoID === ppreProps.pseudoID) || // not pseudo from equal pseudo signature group
                    (isPseudo && pseudoID === ppreProps.pseudoID && utils.hashInHash(sg, ppreProps.sg))) { // pseudo from covered selectors group
                    if (important && !ppreProps.important) {
                        props[ppre] = {
                            block: token,
                            child: child,
                            important: important,
                            sg: sg,
                            path: path,
                            freeze: freeze,
                            freezeID: freezeID,
                            pseudoID: pseudoID
                        };

                        var childIdx = ppreProps.block.indexOf(ppreProps.child);
                        ppreProps.block.splice(childIdx, 1);
                    } else {
                        token.splice(i, 1);
                    }
                }
            } else if (needless(property, props, pre, important, value, child, freeze)) {
                token.splice(i, 1);
            } else {
                child[0].fingerprint = getPropertyFingerprint('', property, value, child, freeze);

                props[ppre] = {
                    block: token,
                    child: child,
                    important: important,
                    sg: sg,
                    path: path,
                    freeze: freeze,
                    freezeID: freezeID,
                    pseudoID: pseudoID
                };
            }
        }
    }
    return token;
};

function getPropertyFingerprint(pre, property, value, declaration, freeze) {
    var fp = freeze ? 'freeze:' : '';

    if (property.indexOf('background') !== -1) {
        return fp + pre + declaration[0].s;
    }

    var vendorId = '';
    var hack9 = 0;
    var functions = {};
    var units = {};

    for (var i = 2; i < value.length; i++) {
        if (!vendorId) {
            vendorId = getVendorIDFromToken(value[i]);
        }

        switch (value[i][1]) {
            case 'ident':
                if (value[i][2] === '\\9') {
                    hack9 = 1;
                }
                break;

            case 'funktion':
                var name = value[i][2][2];

                if (name === 'rect') {
                    // there are 2 forms of rect:
                    //   rect(<top>, <right>, <bottom>, <left>) - standart
                    //   rect(<top> <right> <bottom> <left>) – backwards compatible syntax
                    // only the same form values can be merged
                    if (value[i][3].slice(2).some(function(token) {
                        return token[1] === 'operator' && token[2] === ',';
                    })) {
                        name = 'rect-backward';
                    }
                }

                functions[name] = true;
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

function getVendorIDFromToken(token) {
    var vendorId;

    switch (token[1]) {
        case 'ident':
            vendorId = getVendorFromString(token[2]);
            break;

        case 'funktion':
            vendorId = getVendorFromString(token[2][2]);
            break;
    }

    if (vendorId) {
        return constants.vendorID[vendorId] || '';
    }

    return '';
};

var nameVendorMap = {};
function getVendorFromString(string) {
    if (string[0] === '-') {
        if (string in nameVendorMap) {
            return nameVendorMap[string];
        }

        var secondDashIndex = string.indexOf('-', 2);
        if (secondDashIndex !== -1) {
            return nameVendorMap[string] = string.substr(0, secondDashIndex + 1);
        }
    }

    return '';
};

function deleteProperty(block, id) {
    for (var i = block.length - 1; i > 1; i--) {
        var child = block[i];

        if (child[1] === 'declaration' && child[0].id === id) {
            block.splice(i, 1);
            return;
        }
    }
};

function needless(name, props, pre, important, v, d, freeze) {
    var hack = name[0];

    if (hack === '*' || hack === '_' || hack === '$') {
        name = name.substr(1);
    } else if (hack === '/' && name[1] === '/') {
        hack = '//';
        name = name.substr(2);
    } else {
        hack = '';
    }

    var vendor = getVendorFromString(name);
    var table = constants.nlTable[name.substr(vendor.length)];

    if (table) {
        for (var i = 0; i < table.length; i++) {
            var ppre = getPropertyFingerprint(pre, hack + vendor + table[i], v, d, freeze);
            var property = props[ppre];

            if (property) {
                return !important || property.important;
            }
        }
    }
};

function addToSelector(dest, source) {
    ignore:
    for (var i = 2; i < source.length; i++) {
        var simpleSelectorStr = source[i][0].s;
        for (var j = dest.length; j > 2; j--) {
            var prevSimpleSelectorStr = dest[j - 1][0].s;
            if (prevSimpleSelectorStr === simpleSelectorStr) {
                continue ignore;
            }
            if (prevSimpleSelectorStr < simpleSelectorStr) {
                break;
            }
        }
        dest.splice(j, 0, source[i]);
    }
}

function append(dest, source) {
    for (var i = 2; i < source.length; i++) {
        dest.push(source[i]);
    }
}

function okToJoinByProperties(token1, token2) {
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
        var signature1 = token1[0].pseudoSignature;
        var signature2 = token2[0].pseudoSignature;

        return signature1 === signature2;
    }

    // is it frozen at all?
    return !info1.freeze && !info2.freeze;
}

function rejoinRuleset(token, rule, parent, i) {
    var selector = token[2];
    var block = token[3];

    if (block.length === 2) {
        return null;
    }

    var prev = i === 2 ? null : parent[i - 1];

    if (!prev || prev[1] !== 'ruleset') {
        return;
    }

    var prevSelector = prev[2];
    var prevBlock = prev[3];

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
            append(prevBlock, block);
            return null;
        }

        if (okToJoinByProperties(token, prev)) {
            // try to join by properties
            var r = compare(token, prev);
            if (!r.ne1.length && !r.ne2.length) {
                addToSelector(prevSelector, selector);

                return null;
            }
        }
    }
};

function restructureRuleset(token, rule, parent, i) {
    var selector = token[2];
    var block = token[3];

    if (block.length === 2) {
        return null;
    }

    var prevToken = i === 2 ? null : parent[i - 1];

    if (!prevToken || prevToken[1] !== 'ruleset') {
        return;
    }

    var prevSelector = prevToken[2];
    var prevBlock = prevToken[3];

    if (prevSelector.length > 2 &&
        prevBlock.length > 2 &&
        token[0].pseudoSignature == prevToken[0].pseudoSignature) {
        if (token[1] !== prevToken[1]) {
            return;
        }

        // try to join by selectors
        var prevHash = utils.getHash(prevSelector);
        var hash = utils.getHash(selector);

        if (utils.equalHash(hash, prevHash)) {
            append(prevBlock, block);
            return null;
        }

        // try to join by properties
        var diff = compare(token, prevToken);

        if (diff.eq.length) {
            if (!diff.ne1.length && !diff.ne2.length) {
                if (okToJoinByProperties(token, prevToken)) {
                    addToSelector(prevSelector, selector);
                    return null;
                }
            } else {
                if (diff.ne1.length && !diff.ne2.length) {
                    // prevBlock is subset block
                    var simpleSelectorCount = selector.length - 2; // - type and info
                    var selectorStr = translate(selector, true);
                    var selectorLength = selectorStr.length +
                                         simpleSelectorCount - 1; // delims count
                    var blockLength = calcLength(diff.eq) + // declarations length
                                      diff.eq.length - 1; // decldelims length

                    if (selectorLength < blockLength) {
                        addToSelector(prevSelector, selector);
                        token[3] = [block[0], block[1]].concat(diff.ne1);
                    }
                } else if (!diff.ne1.length && diff.ne2.length) {
                    // token is subset of prevBlock
                    var simpleSelectorCount = prevSelector.length - 2; // - type and info
                    var selectorStr = translate(prevSelector, true);
                    // selectorLength = selector str - delims count
                    var selectorLength = selectorStr.length + simpleSelectorCount - 1;
                    var blockLength = calcLength(diff.eq) + // declarations length
                                      diff.eq.length - 1; // decldelims length

                    if (selectorLength < blockLength) {
                        addToSelector(selector, prevSelector);
                        prevToken[3] = [prevBlock[0], prevBlock[1]].concat(diff.ne2);
                    }
                } else {
                    // diff.ne1.length && diff.ne2.length
                    // extract equal block
                    var newSelector = utils.copyArray(prevSelector);
                    addToSelector(newSelector, selector);
                    var newSelectorStr = translate(newSelector, true);
                    var newSelectorLength = newSelectorStr.length + // selector length
                                            newSelector.length - 1 + // delims length
                                            2; // braces length
                    var blockLength = calcLength(diff.eq) + // declarations length
                                      diff.eq.length - 1; // decldelims length

                    // ok, it's good enough to extract
                    if (blockLength >= newSelectorLength) {
                        var newRuleset = [
                            {},
                            'ruleset',
                            newSelector,
                            [{}, 'block'].concat(diff.eq)
                        ];

                        token[3] = [block[0], block[1]].concat(diff.ne1);
                        prevToken[3] = [prevBlock[0], prevBlock[1]].concat(diff.ne2);
                        parent.splice(i, 0, newRuleset);
                        return newRuleset;
                    }
                }
            }
        }
    }
};

function calcLength(tokens) {
    var length = 0;

    for (var i = 0; i < tokens.length; i++) {
        length += tokens[i][0].s.length;
    };

    return length;
};

function compare(token1, token2) {
    var result = {
        eq: [],
        ne1: [],
        ne2: []
    };

    if (token1[1] !== token2[1]) {
        return result;
    }

    var items1 = token1[3];  // token
    var items2 = token2[3];  // prev
    var hash1 = utils.getHash(items1);
    var hash2 = utils.getHash(items2);
    var fingerprints = {};

    for (var i = 2; i < items1.length; i++) {
        if (items1[i][0].fingerprint) {
            fingerprints[items1[i][0].fingerprint] = true;
        }
    }

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

        if (item[0].s in hash1 === false &&
            // if token1 has overriding declaration, this is not a difference
            item[0].fingerprint in fingerprints === false) {
            result.ne2.push(item);
        }
    }

    return result;
};

module.exports = function(tree, options) {
    return compress(tree, options || {});
};
