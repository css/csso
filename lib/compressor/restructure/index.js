var internalWalkAll = require('../ast/walk.js').all;
var internalWalkRules = require('../ast/walk.js').rules;
var internalWalkRulesRight = require('../ast/walk.js').rulesRight;
var prepare = require('./prepare/index.js');
var initialMergeRuleset = require('./1-initialMergeRuleset.js');
var mergeAtrule = require('./2-mergeAtrule.js');
var disjoin = require('./3-disjoinRuleset.js');
var markShorthands = require('./4-markShorthands.js');
var processShorthands = require('./5-processShorthands.js');
var restructBlock = require('./6-restructBlock.js');
var mergeRuleset = require('./7-mergeRuleset.js');
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
                fn.apply(this, arguments);
                // console.log(require('../ast/translate.js')(ast));
            }
        });

        debug(name, ast);
    }

    function walkRulesetsRight(name, fn) {
        internalWalkRulesRight(ast, function(node) {
            if (node.type === 'Ruleset') {
                fn.apply(this, arguments);
            }
        });

        debug(name, ast);
    }

    function walkAtrules(name, fn) {
        internalWalkRulesRight(ast, function(node) {
            if (node.type === 'Atrule') {
                fn.apply(this, arguments);
            }
        });

        debug(name, ast);
    }

    // prepare ast for restructing
    walk('prepare', prepare);

    // todo: remove initial merge
    walkRulesetsRight('initialMergeRuleset', initialMergeRuleset);
    walkAtrules('mergeAtrule', mergeAtrule);
    walkRulesetsRight('disjoin', disjoin);

    var shortDeclarations = [];
    walkRulesetsRight('buildMaps', function(ruleset, stylesheet) {
        var map = stylesheet.info.selectorsMap;
        if (!map) {
            map = stylesheet.info.selectorsMap = {};
            stylesheet.info.shortDeclarations = shortDeclarations;
            stylesheet.info.lastShortSelector = null;
        }

        var selector = ruleset.selector.selectors.first().info.s;
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
    walkRulesets('mergeRuleset', mergeRuleset);
    walkRulesetsRight('restructRuleset', restructRuleset);
};
