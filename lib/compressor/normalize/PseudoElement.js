module.exports = function PseudoElement(node) {
    // ::PSEUDO { .. } -> ::pseudo { .. }
    node.name = node.name.toLowerCase();
};
