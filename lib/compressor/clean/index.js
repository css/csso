var walk = require('css-tree').walkUp;
var handlers = {
    Space: require('./Space.js'),
    Atrule: require('./Atrule.js'),
    Rule: require('./Rule.js'),
    Declaration: require('./Declaration.js'),
    Universal: require('./Universal.js'),
    Comment: require('./Comment.js')
};

module.exports = function(ast, usageData) {
    walk(ast, function(node, item, list) {
        if (handlers.hasOwnProperty(node.type)) {
            handlers[node.type].call(this, node, item, list, usageData);
        }
    });
};
