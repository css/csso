module.exports = function Nth(node) {
    // :nth-child(ODD)  -> :nth-child(odd)
    // :nth-child(EVEN) -> :nth-child(even)
    if (node.nth.type === 'Identifier') {
        node.nth.name = node.nth.name.toLowerCase();
    }
};
