var DASH = 45; // -

module.exports = function Identifier(node) {
    // ignore custom properties (variables) since its names are case sensitive
    if (node.name.length > 2 &&
        node.name.charCodeAt(0) === DASH &&
        node.name.charCodeAt(1) === DASH) {
        return;
    }

    // .a { PROPERTY: value }
    // ->
    // .a { property: value }
    node.name = node.name.toLowerCase();
};
