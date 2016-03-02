var resolveKeyword = require('../../ast/names.js').keyword;
var translate = require('../../ast/translate.js');
var processSelector = require('./processSelector.js');

module.exports = function walk(node, markDeclaration) {
    switch (node.type) {
        case 'Ruleset':
            node.block.declarations.each(markDeclaration);
            processSelector(node);
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
