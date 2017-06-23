var walk = require('css-tree').walk;
var handlers = {
    Atrule: require('./Atrule.js'),
    AttributeSelector: require('./AttributeSelector.js'),
    Declaration: require('./Declaration.js'),
    Dimension: require('./Dimension.js'),
    Function: require('./Function.js'),
    HexColor: require('./HexColor.js'),
    Identifier: require('./Identifier.js'),
    MediaFeature: require('./MediaFeature.js'),
    Nth: require('./Nth.js'),
    PseudoElementSelector: require('./PseudoElementSelector.js'),
    PseudoClassSelector: require('./PseudoClassSelector.js'),
    TypeSelector: require('./TypeSelector.js')
};

module.exports = function(ast, usageData) {
    walk(ast, function(node, item, list) {
        if (handlers.hasOwnProperty(node.type)) {
            handlers[node.type].call(this, node, item, list, usageData);
        }
    });
};
