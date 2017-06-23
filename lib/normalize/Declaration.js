var resolve = require('css-tree').property;

module.exports = function Declaration(node) {
    // ignore custom properties (variables) since its names are case sensitive
    if (resolve(node.property).custom) {
        return;
    }

    // .a { PROPERTY: value }
    // ->
    // .a { property: value }
    node.property = node.property.toLowerCase();
};
