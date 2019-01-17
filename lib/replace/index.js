const { walk } = require('css-tree');

const handlers = {
    Atrule: require('./Atrule'),
    AttributeSelector: require('./AttributeSelector'),
    Value: require('./Value'),
    Dimension: require('./Dimension'),
    Percentage: require('./Percentage'),
    Number: require('./Number'),
    String: require('./String'),
    Url: require('./Url'),
    HexColor: require('./color').compressHex,
    Identifier: require('./color').compressIdent,
    Function: require('./color').compressFunction
};

module.exports = ast => {
    walk(ast, {
        leave(node, item, list) {
            if (Object.prototype.hasOwnProperty.call(handlers, node.type)) {
                handlers[node.type].call(this, node, item, list);
            }
        }
    });
};
