var walk = require('../ast/walk.js').all;
var handlers = {
    Atrule: require('./Atrule.js'),
    Dimension: require('./Dimension.js'),
    Filter: require('./Function.js'),
    Function: require('./Function.js'),
    FunctionalPseudo: require('./FunctionalPseudo.js'),
    Identifier: require('./Identifier.js'),
    Nth: require('./Nth.js'),
    Property: require('./Property.js'),
    PseudoElement: require('./PseudoElement.js'),
    PseudoClass: require('./PseudoClass.js')
};

module.exports = function(ast, usageData) {
    walk(ast, function(node, item, list) {
        if (handlers.hasOwnProperty(node.type)) {
            handlers[node.type].call(this, node, item, list, usageData);
        }
    });
};
