const { walk } = require('css-tree');
const handlers = {
    Atrule: require('./Atrule'),
    AttributeSelector: require('./AttributeSelector'),
    Value: require('./Value'),
    Dimension: require('./Dimension'),
    Percentage: require('./Percentage'),
    Number: require('./Number'),
    Url: require('./Url'),
    Hash: require('./color').compressHex,
    Identifier: require('./color').compressIdent,
    Function: require('./color').compressFunction
};

module.exports = function(ast) {
    walk(ast, {
        leave(node, item, list) {
            if (handlers.hasOwnProperty(node.type)) {
                handlers[node.type].call(this, node, item, list);
            }
        }
    });
};
