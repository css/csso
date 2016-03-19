var internalWalkRules = require('../../ast/walk.js').rules;
var resolveKeyword = require('../../ast/names.js').keyword;
var translate = require('../../ast/translate.js');
var createDeclarationIndexer = require('./createDeclarationIndexer.js');
var processSelector = require('./processSelector.js');

function prepare(node, markDeclaration) {
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

module.exports = function(ast) {
    var markDeclaration = createDeclarationIndexer();

    internalWalkRules(ast, function(node) {
        prepare(node, markDeclaration);
    });

    return {
        declaration: markDeclaration
    };
};
