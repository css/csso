module.exports = function Atrule(node) {
    // @MEDIA ... {} -> @media ... {}
    node.name = node.name.toLowerCase();
};
