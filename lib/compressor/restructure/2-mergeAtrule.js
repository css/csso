var walkRulesRight = require('css-tree').walkRulesRight;

function isMediaRule(node) {
    return node.type === 'Atrule' && node.name === 'media';
}

function processAtrule(node, item, list) {
    if (!isMediaRule(node)) {
        return;
    }

    var prev = item.prev && item.prev.data;

    if (!prev || !isMediaRule(prev)) {
        return;
    }

    // merge @media with same query
    if (node.expression &&
        prev.expression &&
        node.expression.id === prev.expression.id) {
        prev.block.children.appendList(node.block.children);
        list.remove(item);

        // TODO: use it when we can refer to several points in source
        // prev.loc = {
        //     primary: prev.loc,
        //     merged: node.loc
        // };
    }
}

module.exports = function rejoinAtrule(ast) {
    walkRulesRight(ast, function(node, item, list) {
        if (node.type === 'Atrule') {
            processAtrule(node, item, list);
        }
    });
};
