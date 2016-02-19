var compressKeyframes = require('./atrule/keyframes.js');

module.exports = function(node, item, list) {
    // compress @keyframe selectors
    if (/^(-[a-z\d]+-)?keyframes$/.test(node.name)) {
        compressKeyframes(node, item, list);
    }
};
