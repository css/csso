const { generate, walk, keyword: resolveKeyword } = require('css-tree');
const createDeclarationIndexer = require('./createDeclarationIndexer');
const processSelector = require('./processSelector');

module.exports = function prepare(ast, options) {
    const markDeclaration = createDeclarationIndexer();

    walk(ast, {
        visit: 'Rule',
        enter: function enter(node) {
            node.block.children.each(markDeclaration);
            processSelector(node, options.usage);
        }
    });

    walk(ast, {
        visit: 'Atrule',
        enter(node) {
            if (node.prelude) {
                node.prelude.id = null; // pre-init property to avoid multiple hidden class for generate
                node.prelude.id = generate(node.prelude);
            }

            // compare keyframe selectors by its values
            // NOTE: still no clarification about problems with keyframes selector grouping (issue #197)
            if (resolveKeyword(node.name).basename === 'keyframes') {
                node.block.avoidRulesMerge = true; /* probably we don't need to prevent those merges for @keyframes
                                                       TODO: need to be checked */
                node.block.children.each(rule => {
                    rule.prelude.children.each(simpleselector => {
                        simpleselector.compareMarker = simpleselector.id;
                    });
                });
            }
        }
    });

    return {
        declaration: markDeclaration
    };
};
