const { walk } = require('css-tree');

const handlers = {
    Atrule: require('./Atrule'),
    Rule: require('./Rule'),
    Declaration: require('./Declaration'),
    TypeSelector: require('./TypeSelector'),
    Comment: require('./Comment'),
    Operator: require('./Operator'),
    WhiteSpace: require('./WhiteSpace')
};

module.exports = (ast, options) => {
    walk(ast, {
        leave(node, item, list) {
            if (Object.prototype.hasOwnProperty.call(handlers, node.type)) {
                handlers[node.type].call(this, node, item, list, options);
            }
        }
    });
};
