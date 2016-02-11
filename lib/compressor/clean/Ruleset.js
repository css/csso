module.exports = function cleanRuleset(node, parent, list, item) {
    if (!node.selector || node.block.declarations.isEmpty()) {
        list.remove(item);
    }
};
