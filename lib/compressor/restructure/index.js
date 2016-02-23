var internalWalkRules = require('../ast/walk.js').rules;
var internalWalkRulesRight = require('../ast/walk.js').rulesRight;
var translate = require('../ast/translate.js');
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

module.exports = function(ast, debug) {
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

    var declarationMarker = (function() {
        var names = new Index();
        var values = new Index();

        return function markDeclaration(node) {
            // node.id = translate(node);

            var property = node.property.name;
            var value = translate(node.value);

            node.id = names.resolve(property) + (values.resolve(value) << 12);
            node.length = property.length + 1 + value.length;

            return node;
        };
    })();

    // prepare ast for restructing
    internalWalkRules(ast, function(node) {
        prepare(node, declarationMarker);
    });
    debug('prepare', ast);

    // todo: remove initial merge
    walkRulesetsRight('initialMergeRuleset', initialMergeRuleset);
    walkAtrules('mergeAtrule', mergeAtrule);
    walkRulesetsRight('disjoinRuleset', disjoinRuleset);

    restructShorthand(ast, declarationMarker);
    debug('restructShorthand', ast);

    restructBlock(ast);
    debug('restructBlock', ast);

    walkRulesets('mergeRuleset', mergeRuleset);
    walkRulesetsRight('restructRuleset', restructRuleset);
};
