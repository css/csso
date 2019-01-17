const resolveKeyword = require('css-tree').keyword;
const compressKeyframes = require('./atrule/keyframes');

module.exports = node => {
    // compress @keyframe selectors
    if (resolveKeyword(node.name).basename === 'keyframes') {
        compressKeyframes(node);
    }
};
