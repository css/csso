var internalWalkRules = require('../../ast/walk.js').rules;
var resolveKeyword = require('../../ast/names.js').keyword;
var translate = require('../../ast/translate.js');
var createIndexer = require('./indexer.js');
var processSelector = require('./processSelector.js');

function walk(node, indexer, usageData) {
    switch (node.type) {
        case 'Ruleset':
            node.block.declarations.each(indexer.declaration.add, indexer.declaration);
            processSelector(node, usageData);
            break;

        case 'Atrule':
            if (node.expression) {
                node.expression.id = translate(node.expression);
            }

            // compare keyframe selectors by its values
            // NOTE: still no clarification about problems with keyframes selector grouping (issue #197)
            if (resolveKeyword(node.name).name === 'keyframes') {
                node.block.avoidRulesMerge = true;  /* probably we don't need to prevent those merges for @keyframes
                                                       TODO: need to be checked */
                node.block.rules.each(function(ruleset) {
                    ruleset.selector.selectors.each(function(simpleselector) {
                        simpleselector.compareMarker = simpleselector.id;
                    });
                });
            }
            break;
    }
};

module.exports = function prepare(ast, usageData) {
    var indexer = createIndexer();

    internalWalkRules(ast, function(node) {
        walk(node, indexer, usageData);
    });

    return indexer;
};
