var lexer = require('css-tree').lexer;

module.exports = function Identifier(node) {
    // additional test for values
    if (this.declaration !== null) {
        // ignore custom properties (variables) since its names are case sensitive
        if (!lexer.matchDeclaration(this.declaration).isKeyword(node)) {
            return;
        }
    } else if (this.atruleExpression !== null) {
        // do nothing if at-rule is not in a white list
        if (this.atrule.name !== 'import' &&
            this.atrule.name !== 'media' &&
            this.atrule.name !== 'supports') {
            return;
        }
    } else {
        // not a declaration or at-rule expression
        return;
    }

    node.name = node.name.toLowerCase();
};
