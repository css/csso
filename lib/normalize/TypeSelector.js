module.exports = function TypeSelector(node) {
    // FOO { .. }
    // ->
    // foo { .. }
    node.name = node.name.toLowerCase();
};
