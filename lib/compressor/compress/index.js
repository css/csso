var compressKeyframes = require('./keyframes.js');
var color = require('./color.js');

module.exports = {
    attrib: require('./attrib.js'),
    declaration: require('./declaration.js'),
    dimension: require('./dimension.js'),
    number: require('./number.js'),
    string: require('./string.js'),

    vhash: color.compressHex,
    ident: color.compressIdent,
    funktion: color.compressFunction,

    atruler: function(node, parent) {
        var name = node.name.name.value;

        // compress @keyframe selectors
        if (/^(-[a-z\d]+-)?keyframes$/.test(name)) {
            compressKeyframes(node);
        }
    }
};
