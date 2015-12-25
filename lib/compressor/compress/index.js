var handlers = {
    Atrule: require('./Atrule.js'),
    Attribute: require('./Attribute.js'),
    Value: require('./Value.js'),
    Dimension: require('./Dimension.js'),
    Percentage: require('./Number.js'),
    Number: require('./Number.js'),
    String: require('./String.js'),
    Hash: require('./color.js').compressHex,
    Identifier: require('./color.js').compressIdent,
    Function: require('./color.js').compressFunction
};

module.exports = function(node, parent, array, index) {
    if (handlers.hasOwnProperty(node.type)) {
        return handlers[node.type].call(this, node, parent, array, index);
    }
};
