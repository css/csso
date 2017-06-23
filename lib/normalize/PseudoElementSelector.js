module.exports = function PseudoElementSelector(node) {
    // ::PSEUDO { .. } -> ::pseudo { .. }
    node.name = node.name.toLowerCase();
};
