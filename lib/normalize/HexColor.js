module.exports = function HexColor(node) {
    // #ABCDEF -> #abcdef
    node.value = node.value.toLowerCase();
};
