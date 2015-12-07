var handlers = {
    Space: require('./Space.js'),
    Atrule: require('./Atrule.js'),
    Ruleset: require('./Ruleset.js'),
    Declaration: require('./Declaration.js')
};

module.exports = function(node, parent, array, index) {
    if (handlers.hasOwnProperty(node.type)) {
        return handlers[node.type].call(this, node, parent, array, index);
    }
};
