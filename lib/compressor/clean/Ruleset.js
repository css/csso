module.exports = function cleanRuleset(node) {
    if (!node.selector || !node.block.declarations.length) {
        return null;
    }
};
