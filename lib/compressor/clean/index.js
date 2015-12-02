function remove(node) {
    node.remove();
}

module.exports = {
    comment: remove,
    s: require('./spaces.js'),
    decldelim: remove,
    delim: remove,
    atrules: require('./atrules.js'),
    atruleb: function(node) {
        if (!node.last.length) {
            node.remove();
        }
    },
    atruler: function(node) {
        if (!node.block || !node.block.length) {
            node.remove();
        }
    },
    ruleset: function(node) {
        if (!node.block || !node.block.length) {
            node.remove();
        }
    }
};
