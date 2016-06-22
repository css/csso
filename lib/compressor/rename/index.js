var walk = require('../../utils/walk').all;

module.exports = function(ast, rename) {
    walk(ast, function(node) {
        if (node.type === 'Class' && rename.classes) {
            node.name = rename.classes(node.name);
        }
    });
};
