var hasOwnProperty = Object.prototype.hasOwnProperty;

function notUsed(node, usageData) {
    return node.selector.selectors.some(function(selector) {
        return selector.sequence.some(function(node) {
            switch (node.type) {
                case 'Class':
                    return usageData.classes && !hasOwnProperty.call(usageData.classes, node.name);

                case 'Id':
                    return usageData.ids && !hasOwnProperty.call(usageData.ids, node.name);

                case 'Identifier':
                    // ignore universal selector
                    if (node.name !== '*') {
                        return usageData.tags && !hasOwnProperty.call(usageData.tags, node.name);
                    }

                    break;
            }
        });
    });
}

module.exports = function cleanRuleset(node, item, list, usageData) {
    if (node.selector.selectors.isEmpty() ||
        node.block.declarations.isEmpty() ||
        (usageData && notUsed(node, usageData))) {
        list.remove(item);
    }
};
