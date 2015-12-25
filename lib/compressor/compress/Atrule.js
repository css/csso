var compressKeyframes = require('./atrule/keyframes.js');

module.exports = function(node, parent, array, index) {
    // compress @keyframe selectors
    if (/^(-[a-z\d]+-)?keyframes$/.test(node.name)) {
        compressKeyframes(node, parent, array, index);
    }
};
