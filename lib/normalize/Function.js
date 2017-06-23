module.exports = function Function(node) {
    // FUNCTION(..) -> function(..)
    node.name = node.name.toLowerCase();
};
