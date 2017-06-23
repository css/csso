module.exports = function PseudoClassSelector(node) {
    // :PSEUDO { .. } -> :pseudo { .. }
    node.name = node.name.toLowerCase();
};
