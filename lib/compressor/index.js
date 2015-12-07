var convertToInternal = require('./ast/gonzalesToInternal.js');
var internalTranslate = require('./ast/translate.js');
var internalWalkAll = require('./ast/walk.js').all;
var internalWalkRules = require('./ast/walk.js').rules;
var internalWalkRulesRight = require('./ast/walk.js').rulesRight;
var wrapAst = require('./ast/index');
var cleanFn = require('./clean');
var compressFn = require('./compress');
var markShorthands = require('./restructure/markShorthands.js');
var processShorthands = require('./restructure/processShorthands.js');
var disjoin = require('./restructure/disjoinRuleset.js');
var rejoinRuleset = require('./restructure/rejoinRuleset.js');
var rejoinAtrule = require('./restructure/rejoinAtrule.js');
var restructBlock = require('./restructure/restructBlock.js');
var restructRuleset = require('./restructure/restructRuleset.js');
var debug;
var lastDebug;

function debug_(name, token) {
    var line = (lastDebug ? '(' + ((Date.now() - lastDebug) / 1000).toFixed(3) + 'ms) ' : '') + name;

    if (token) {
        // var css = internalTranslate(token, true).trim();
        var max = 1000;
        // line += '\n  ' + (css.length > max ? css.substr(0, max) + '...' : css) + '\n';
    }

    console.log(line);
    lastDebug = Date.now();
}

function injectInfo(token) {
    for (var i = token.length - 1; i > -1; i--) {
        var child = token[i];

        if (Array.isArray(child)) {
            injectInfo(child);
            child.unshift({});
        }
    }
}

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

function compressBlock(ast, restructuring, num) {
    function walk(name, fn) {
        internalWalkAll(internalAst, fn);

        debug(name, internalAst);
    }

    function walkRulesets(name, fn) {
        internalWalkRulesRight(internalAst, function(node) {
            if (node.type === 'Ruleset') {
                return fn.apply(this, arguments);
            }
        });

        debug(name, internalAst);
    }

    function walkAtrules(name, fn) {
        internalWalkRulesRight(internalAst, function(node) {
            if (node.type === 'Atrule') {
                return fn.apply(this, arguments);
            }
        });

        debug(name, internalAst);
    }

    debug('Compress block #' + num, ast);

    var internalAst = convertToInternal(ast);
    internalAst.firstAtrulesAllowed = ast.firstAtrulesAllowed;
    debug('convertToInternal');

    walk('clean', cleanFn);
    walk('compress', compressFn);

    // structure optimisations
    if (restructuring) {
        walk('prepare', require('./prepare/index.js'));

        // todo: remove
        walkRulesets('rejoinRuleset', rejoinRuleset);
        walkAtrules('rejoinAtrule', rejoinAtrule);
        walkRulesets('disjoin', disjoin);

        var shortDeclarations = [];
        walkRulesets('buildMaps', function(ruleset, stylesheet) {
            var map = stylesheet.info.selectorsMap;
            if (!map) {
                map = stylesheet.info.selectorsMap = {};
                stylesheet.info.shortDeclarations = shortDeclarations;
                stylesheet.info.lastShortSelector = null;
            }

            var selector = ruleset.selector.selectors[0].info.s;
            if (selector in map === false) {
                map[selector] = {
                    props: {},
                    shorts: {}
                };
            }
        });

        walkRulesets('markShorthands', markShorthands);
        processShorthands(shortDeclarations);
        debug('processShorthand', internalAst);

        walkRulesets('restructBlock', restructBlock);

        walkRulesets('rejoinRuleset', rejoinRuleset);

        walkRulesets('restructRuleset', restructRuleset);
    }

    return internalAst;
}

function compress(ast, options) {
    debug = Boolean(options.debug) ? debug_ : function() {};

    ast = ast || [{}, 'stylesheet'];

    if (typeof ast[0] === 'string') {
        injectInfo([ast]);
    }

    var result = [];
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
            if (result.length > 0) {
                result.push({
                    type: 'Raw',
                    value: '\n'
                });
            }

            result.push({
                type: 'Comment',
                value: block.comment[2]
            });

            // add \n after comment if block is not empty
            if (block.stylesheet.rules.length > 0) {
                result.push({
                    type: 'Raw',
                    value: '\n'
                });
            }
        }

        result.push.apply(result, block.stylesheet.rules);

        if (firstAtrulesAllowed && result.length > 0) {
            for (var i = block.stylesheet.rules.length - 1; i >= 0; i--) {
                var node = block.stylesheet.rules[i];

                if (node.type !== 'Space' && node.type !== 'Comment') {
                    if (node.type === 'Atrule') {
                        if (node.name === 'import' || node.name === 'charset') {
                            continue;
                        }
                    }

                    firstAtrulesAllowed = false;
                    break;
                }
            }
        }
    } while (block.offset < ast.length);

    return internalTranslate({
        type: 'StyleSheet',
        rules: result
    });
}

module.exports = function(tree, options) {
    return compress(tree, options || {});
};
