var translate = require('../utils/translate');
var walker = require('../utils/walker');
var wrapAst = require('./ast/index');
var cleanFn = require('./clean');
var compressFn = require('./compress');
var markShorthands = require('./restructure/markShorthands.js');
var processShorthands = require('./restructure/processShorthands.js');
var disjoin = require('./restructure/disjoin.js');
var rejoinRuleset = require('./restructure/rejoinRuleset.js');
var rejoinAtrule = require('./restructure/rejoinAtrule.js');
var restructureBlock = require('./restructure/block.js');
var restructureRuleset = require('./restructure/ruleset.js');
var debug;
var lastDebug;

function debug_(name, token) {
    var line = (lastDebug ? '(' + ((Date.now() - lastDebug) / 1000).toFixed(3) + 'ms) ' : '') + name;

    if (token) {
        var css = translate(token, true).trim();
        var max = 1000;
        line += '\n  ' + (css.length > max ? css.substr(0, max) + '...' : css) + '\n';
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
        root.walk(fn);

        debug(name, root.token);
    }

    function walkRulesets(name, fn) {
        var stylesheets = root.rulesetParents;

        stylesheets.forEach(function(stylesheet, id) {
            for (var i = stylesheet.length - 1; i >= 2; i--) {
                var token = stylesheet[i];
                var result;

                if (token[1] === 'ruleset') {
                    var result = fn.call(this, token, stylesheet, i);
                    if (result === null) {
                        stylesheet.splice(i, 1);
                    } else if (result) {
                        i++;
                    }

                    if (debug === debug_) {
                        console.log('>', translate(ast, true));
                    }
                }
            }
        }, context);

        debug(name, root.token);
    }

    function walkAtrules(name, fn) {
        var stylesheets = root.rulesetParents;

        stylesheets.forEach(function(stylesheet, id) {
            for (var i = stylesheet.length - 1; i >= 2; i--) {
                var token = stylesheet[i];
                var result;

                if (token[1] === 'atruler') {
                    var result = fn.call(this, token, stylesheet, i);
                    if (result === null) {
                        stylesheet.splice(i, 1);
                    }
                }
            }
        }, context);

        debug(name, root.token);
    }

    debug('Compress block #' + num, ast);

    var context = {
        shortDeclarations: [],
        lastShortSelector: 0
    };

    // compression without restructure
    var root = wrapAst(ast);
    root.firstAtrulesAllowed = ast.firstAtrulesAllowed;
    root.rulesetParents = new Set();
    debug('wrap AST');

    // to make analys simpler
    walk('clean comments', {
        comment: function(node) {
            node.remove();
        }
    });

    walk('clean', cleanFn);
    walk('compress', compressFn);

    // structure optimisations
    if (restructuring) {
        walk('prepare', require('./prepare/index.js'));

        // todo: remove
        walkRulesets('rejoinRuleset', rejoinRuleset);
        walkAtrules('rejoinAtrule', rejoinAtrule);
        walkRulesets('disjoin', disjoin);

        walkRulesets('buildMaps', function(ruleset, stylesheet) {
            var map = stylesheet[0].selectorsMap;
            if (!map) {
                map = stylesheet[0].selectorsMap = {};
            }

            var selector = ruleset[2][2][0].s;
            if (selector in map === false) {
                map[selector] = {
                    props: {},
                    shorts: {}
                };
            }
        });

        walkRulesets('markShorthands', markShorthands);
        processShorthands(context.shortDeclarations);
        debug('processShorthand', ast);

        walkRulesets('restructureBlock', restructureBlock);

        walkRulesets('rejoinRuleset', rejoinRuleset);

        walkRulesets('restructureRuleset', restructureRuleset);
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
}

module.exports = function(tree, options) {
    return compress(tree, options || {});
};
