module.exports = function MediaFeature(node) {
    // (FEATURE: ..) -> (feature: ..)
    node.name = node.name.toLowerCase();

    // (..: IDENT) -> (..: ident)
    if (node.value !== null && node.value.type === 'Identifier') {
        node.value.name = node.value.name.toLowerCase();
    }
};
