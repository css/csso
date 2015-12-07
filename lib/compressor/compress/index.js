var compressKeyframes = require('./keyframes.js');
var color = require('./color.js');

var handlers = {
    Attribute: require('./Attribute.js'),
    Declaration: require('./Declaration.js'),
    Dimension: require('./Dimension.js'),
    Percentage: require('./Number.js'),
    Number: require('./Number.js'),
    String: require('./String.js'),
    Hash: color.compressHex,
    Identifier: color.compressIdent,
    Function: color.compressFunction,
    Atrule: function(node, parent, array, index) {
        // compress @keyframe selectors
        if (/^(-[a-z\d]+-)?keyframes$/.test(node.name)) {
            compressKeyframes(node, parent, array, index);
        }
    }
};

module.exports = function(node, parent, array, index) {
    if (handlers.hasOwnProperty(node.type)) {
        return handlers[node.type].call(this, node, parent, array, index);
    }
};
