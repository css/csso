module.exports = function(node) {
    if (!node.selector || !node.block.declarations.length) {
        return null;
    }
};
