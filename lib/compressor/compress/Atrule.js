var compressKeyframes = require('./atrule/keyframes.js');

module.exports = function(node, parent, list, item) {
    // compress @keyframe selectors
    if (/^(-[a-z\d]+-)?keyframes$/.test(node.name)) {
        compressKeyframes(node, parent, list, item);
    }
};
