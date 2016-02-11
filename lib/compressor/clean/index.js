var handlers = {
    Space: require('./Space.js'),
    Atrule: require('./Atrule.js'),
    Ruleset: require('./Ruleset.js'),
    Declaration: require('./Declaration.js')
};

module.exports = function(node, parent, list, item) {
    if (handlers.hasOwnProperty(node.type)) {
        handlers[node.type].call(this, node, parent, list, item);
    }
};
