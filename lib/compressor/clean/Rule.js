var hasOwnProperty = Object.prototype.hasOwnProperty;

function cleanUnused(node, usageData) {
    return node.selector.children.each(function(selector, item, list) {
        var hasUnused = selector.children.some(function(node) {
            switch (node.type) {
                case 'Class':
                    return usageData.classes && !hasOwnProperty.call(usageData.classes, node.name);

                case 'Id':
                    return usageData.ids && !hasOwnProperty.call(usageData.ids, node.name);

                case 'Type':
                    // TODO: remove toLowerCase when type selectors will be normalized
                    return usageData.tags && !hasOwnProperty.call(usageData.tags, node.name.toLowerCase());
            }
        });

        if (hasUnused) {
            list.remove(item);
        }
    });
}

module.exports = function cleanRuleset(node, item, list, usageData) {
    if (usageData) {
        cleanUnused(node, usageData);
    }

    if (node.selector.children.isEmpty() ||
        node.block.children.isEmpty()) {
        list.remove(item);
    }
};
