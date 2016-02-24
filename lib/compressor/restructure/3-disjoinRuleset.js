module.exports = function disjoin(node, item, list) {
    var selectors = node.selector.selectors;

    // generate new rule sets:
    // .a, .b { color: red; }
    // ->
    // .a { color: red; }
    // .b { color: red; }

    // while there are more than 1 simple selector split for rulesets
    while (selectors.head !== selectors.tail) {
        list.insert(list.createItem({
            type: 'Ruleset',
            info: node.info,
            pseudoSignature: node.pseudoSignature,
            selector: {
                type: 'Selector',
                info: node.selector.info,
                selectors: selectors.extract(null, selectors.head)
            },
            block: {
                type: 'Block',
                info: node.block.info,
                declarations: node.block.declarations.copy()
            }
        }), item);
    }
};
