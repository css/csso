var compressKeyframes = require('./keyframes.js');
var color = require('./color.js');

var handlers = {
    Attribute: require('./Attribute.js'),
    Declaration: require('./Declaration_.js'),
    Dimension: require('./Dimension_.js'),
    Percentage: require('./Number_.js'),
    Number: require('./Number_.js'),
    String: require('./String_.js'),
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
