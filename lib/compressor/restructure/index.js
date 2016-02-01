var internalWalkAll = require('../ast/walk.js').all;
var internalWalkRules = require('../ast/walk.js').rules;
var internalWalkRulesRight = require('../ast/walk.js').rulesRight;
var prepare = require('./prepare/index.js');
var initialRejoinRuleset = require('./1-initialRejoinRuleset.js');
var rejoinAtrule = require('./2-rejoinAtrule.js');
var disjoin = require('./3-disjoinRuleset.js');
var markShorthands = require('./4-markShorthands.js');
var processShorthands = require('./5-processShorthands.js');
var restructBlock = require('./6-restructBlock.js');
var rejoinRuleset = require('./7-rejoinRuleset.js');
var restructRuleset = require('./8-restructRuleset.js');

module.exports = function(ast, debug) {
    function walk(name, fn) {
        internalWalkAll(ast, fn);

        debug(name, ast);
    }

    function walkRulesets(name, fn) {
        // console.log(require('../ast/translate.js')(ast));
        internalWalkRules(ast, function(node) {
            if (node.type === 'Ruleset') {
                return fn.apply(this, arguments);
                // console.log(require('../ast/translate.js')(ast));
            }
        });

        debug(name, ast);
    }

    function walkRulesetsRight(name, fn) {
        internalWalkRulesRight(ast, function(node) {
            if (node.type === 'Ruleset') {
                return fn.apply(this, arguments);
            }
        });

        debug(name, ast);
    }

    function walkAtrules(name, fn) {
        internalWalkRulesRight(ast, function(node) {
            if (node.type === 'Atrule') {
                return fn.apply(this, arguments);
            }
        });

        debug(name, ast);
    }

    // prepare ast for restructing
    walk('prepare', prepare);

    // todo: remove initial rejoin
    walkRulesetsRight('initialRejoinRuleset', initialRejoinRuleset);
    walkAtrules('rejoinAtrule', rejoinAtrule);
    walkRulesetsRight('disjoin', disjoin);

    var shortDeclarations = [];
    walkRulesetsRight('buildMaps', function(ruleset, stylesheet) {
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

    walkRulesetsRight('markShorthands', markShorthands);
    processShorthands(shortDeclarations);
    debug('processShorthand', ast);

    walkRulesetsRight('restructBlock', restructBlock);
    // console.log(require('../ast/translate.js')(ast));
    walkRulesets('rejoinRuleset', rejoinRuleset);
    walkRulesetsRight('restructRuleset', restructRuleset);
};
