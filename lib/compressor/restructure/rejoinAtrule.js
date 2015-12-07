function isMediaRule(node) {
    return node.type === 'Atrule' && node.name === 'media';
}

module.exports = function rejoinAtrule(node, parent, array, i) {
    if (!isMediaRule(node)) {
        return;
    }

    var prev = i ? array[i - 1] : null;

    if (!prev || !isMediaRule(prev)) {
        return;
    }

    // merge @media with same query
    if (node.expression.info.s === prev.expression.info.s) {
        Array.prototype.push.apply(prev.block.rules, node.block.rules);
        return null;
    }
};
