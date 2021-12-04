const { walk } = require('css-tree');
const handlers = {
    Atrule: require('./Atrule'),
    Comment: require('./Comment'),
    Declaration: require('./Declaration'),
    Raw: require('./Raw'),
    Rule: require('./Rule'),
    TypeSelector: require('./TypeSelector'),
    WhiteSpace: require('./WhiteSpace')
};

module.exports = function(ast, options) {
    walk(ast, {
        leave(node, item, list) {
            if (handlers.hasOwnProperty(node.type)) {
                handlers[node.type].call(this, node, item, list, options);
            }
        }
    });
};
