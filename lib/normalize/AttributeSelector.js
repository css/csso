module.exports = function Declaration(node) {
    // [ATTR=..]
    // ->
    // [attr=..]
    node.name.name = node.name.name.toLowerCase();
};
