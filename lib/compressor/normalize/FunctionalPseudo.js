module.exports = function FunctionalPseudo(node) {
    // :PSEUDO(..) { .. } -> :pseudo(..) { .. }
    node.name = node.name.toLowerCase();
};
