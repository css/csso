module.exports = function cleanRuleset(node, item, list) {
    if (node.selector.selectors.isEmpty() ||
        node.block.declarations.isEmpty()) {
        list.remove(item);
    }
};
