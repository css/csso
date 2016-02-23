function isMediaRule(node) {
    return node.type === 'Atrule' && node.name === 'media';
}

module.exports = function rejoinAtrule(node, item, list) {
    if (!isMediaRule(node)) {
        return;
    }

    var prev = item.prev && item.prev.data;

    if (!prev || !isMediaRule(prev)) {
        return;
    }

    // merge @media with same query
    if (node.expression.id === prev.expression.id) {
        prev.block.rules.insertList(node.block.rules);
        list.remove(item);
    }
};
