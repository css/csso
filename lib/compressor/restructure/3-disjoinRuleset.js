var List = require('css-tree').List;
var walkRulesRight = require('css-tree').walkRulesRight;

function processRule(node, item, list) {
    var selectors = node.selector.selectors;

    // generate new rule sets:
    // .a, .b { color: red; }
    // ->
    // .a { color: red; }
    // .b { color: red; }

    // while there are more than 1 simple selector split for rulesets
    while (selectors.head !== selectors.tail) {
        var newSelectors = new List();
        newSelectors.insert(selectors.remove(selectors.head));

        list.insert(list.createItem({
            type: 'Rule',
            info: node.info,
            selector: {
                type: 'Selector',
                info: node.selector.info,
                selectors: newSelectors
            },
            block: {
                type: 'Block',
                info: node.block.info,
                declarations: node.block.declarations.copy()
            },
            pseudoSignature: node.pseudoSignature
        }), item);
    }
};

module.exports = function disjoinRule(ast) {
    walkRulesRight(ast, function(node, item, list) {
        if (node.type === 'Rule') {
            processRule(node, item, list);
        }
    });
};
