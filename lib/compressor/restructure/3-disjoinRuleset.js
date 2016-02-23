function copyObject(obj) {
    var result = {};

    for (var key in obj) {
        result[key] = obj[key];
    }

    return result;
}

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
            info: copyObject(node.info),
            pseudoSignature: node.pseudoSignature,
            selector: {
                type: 'Selector',
                info: copyObject(node.selector.info),
                selectors: selectors.extract(null, selectors.head)
            },
            block: {
                type: 'Block',
                info: copyObject(node.block.info),
                declarations: node.block.declarations.copy()
            }
        }), item);
    }
};
