module.exports = function cleanRuleset(node, item, list) {
    if (!node.selector || node.block.declarations.isEmpty()) {
        list.remove(item);
    }
};
