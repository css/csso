module.exports = function PseudoClass(node) {
    // :PSEUDO { .. } -> :pseudo { .. }
    node.name = node.name.toLowerCase();
};
