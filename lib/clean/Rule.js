var hasOwnProperty = Object.prototype.hasOwnProperty;
var walk = require('css-tree').walk;

function cleanUnused(selectorList, usageData) {
    selectorList.children.each(function(selector, item, list) {
        var shouldRemove = false;

        walk(selector, function(node) {
            // ignore nodes in nested selectors
            if (this.selector === null || this.selector === selectorList) {
                switch (node.type) {
                    case 'SelectorList':
                        // TODO: remove toLowerCase when pseudo selectors will be normalized
                        // ignore selectors inside :not()
                        if (this['function'] === null || this['function'].name.toLowerCase() !== 'not') {
                            if (cleanUnused(node, usageData)) {
                                shouldRemove = true;
                            }
                        }
                        break;

                    case 'ClassSelector':
                        if (usageData.classes !== null && !hasOwnProperty.call(usageData.classes, node.name)) {
                            shouldRemove = true;
                        }
                        break;

                    case 'IdSelector':
                        if (usageData.ids !== null && !hasOwnProperty.call(usageData.ids, node.name)) {
                            shouldRemove = true;
                        }
                        break;

                    case 'TypeSelector':
                        // TODO: remove toLowerCase when type selectors will be normalized
                        // ignore universal selectors
                        if (node.name.charAt(node.name.length - 1) !== '*') {
                            if (usageData.tags !== null && !hasOwnProperty.call(usageData.tags, node.name.toLowerCase())) {
                                shouldRemove = true;
                            }
                        }
                        break;
                }
            }
        });

        if (shouldRemove) {
            list.remove(item);
        }
    });

    return selectorList.children.isEmpty();
}

module.exports = function cleanRuleset(node, item, list, usageData) {
    if (usageData) {
        cleanUnused(node.selector, usageData);
    }

    if (node.selector.children.isEmpty() ||
        node.block.children.isEmpty()) {
        list.remove(item);
    }
};
