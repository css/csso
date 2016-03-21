var internalWalkRules = require('../ast/walk.js').rules;
var internalWalkRulesRight = require('../ast/walk.js').rulesRight;
var prepare = require('./prepare/index.js');
var initialMergeRuleset = require('./1-initialMergeRuleset.js');
var mergeAtrule = require('./2-mergeAtrule.js');
var disjoinRuleset = require('./3-disjoinRuleset.js');
var restructShorthand = require('./4-restructShorthand.js');
var restructBlock = require('./6-restructBlock.js');
var mergeRuleset = require('./7-mergeRuleset.js');
var restructRuleset = require('./8-restructRuleset.js');

function Index() {
    this.seed = 0;
    this.map = Object.create(null);
}

Index.prototype.resolve = function(str) {
    var index = this.map[str];

    if (!index) {
        index = ++this.seed;
        this.map[str] = index;
    }

    return index;
};

module.exports = function(ast, usageData, debug) {
    function walkRulesets(name, fn) {
        internalWalkRules(ast, function(node, item, list) {
            if (node.type === 'Ruleset') {
                fn.call(this, node, item, list);
            }
        });

        debug(name, ast);
    }

    function walkRulesetsRight(name, fn) {
        internalWalkRulesRight(ast, function(node, item, list) {
            if (node.type === 'Ruleset') {
                fn.call(this, node, item, list);
            }
        });

        debug(name, ast);
    }

    function walkAtrules(name, fn) {
        internalWalkRulesRight(ast, function(node, item, list) {
            if (node.type === 'Atrule') {
                fn.call(this, node, item, list);
            }
        });

        debug(name, ast);
    }

    // prepare ast for restructing
    var indexer = prepare(ast, usageData);
    debug('prepare', ast);

    // NOTE: direction should be left to right, since rulesets merge to left
    // ruleset. When direction right to left unmerged rulesets may prevent lookup
    // TODO: remove initial merge
    walkRulesets('initialMergeRuleset', initialMergeRuleset);

    walkAtrules('mergeAtrule', mergeAtrule);
    walkRulesetsRight('disjoinRuleset', disjoinRuleset);

    restructShorthand(ast, indexer);
    debug('restructShorthand', ast);

    restructBlock(ast);
    debug('restructBlock', ast);

    walkRulesets('mergeRuleset', mergeRuleset);
    walkRulesetsRight('restructRuleset', restructRuleset);
};
