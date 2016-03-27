module.exports = function(node) {
    // :nth-child(ODD)  -> :nth-child(odd)
    // :nth-child(EVEN) -> :nth-child(even)
    // :nth-child(N)    -> :nth-child(n)
    node.value = node.value.toLowerCase();
};
