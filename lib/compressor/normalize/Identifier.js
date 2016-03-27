var DASH = 45; // -

module.exports = function Identifier(node) {
    // @atrule FOO BAR ... -> @atrule foo bar ...
    if (this.atruleExpression) {
        node.name = node.name.toLowerCase();
        return;
    }

    // DIV.class Span {} -> div.class span {}
    if (this.selector !== null) {
        // ignore identifiers in attribute selector since its names are case sensitive
        if (this.attribute !== null) {
            return;
        }

        node.name = node.name.toLowerCase();
        return;
    }

    // .a { property: FOO Bar baz }
    // ->
    // .a { property: foo bar baz }
    if (this.declaration !== null) {
        // ignore custom properties (variables) since its names are case sensitive
        if (node.name.length > 2 &&
            node.name.charCodeAt(0) === DASH &&
            node.name.charCodeAt(1) === DASH) {
            return;
        }

        node.name = node.name.toLowerCase();
        return;
    }
};
