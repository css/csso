var walk = require('css-tree').walkUp;
var handlers = {
    Atrule: require('./Atrule'),
    AttributeSelector: require('./AttributeSelector'),
    Value: require('./Value'),
    Dimension: require('./Dimension'),
    Percentage: require('./Number'),
    Number: require('./Number'),
    String: require('./String'),
    Url: require('./Url'),
    HexColor: require('./color').compressHex,
    Identifier: require('./color').compressIdent,
    Function: require('./color').compressFunction
};

module.exports = function(ast) {
    walk(ast, function(node, item, list) {
        if (handlers.hasOwnProperty(node.type)) {
            handlers[node.type].call(this, node, item, list);
        }
    });
};
