var hasOwnProperty = Object.prototype.hasOwnProperty;
var walk = require('css-tree').walk;
var { hasNoChildren } = require('./utils');

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
                        if (this.function === null || this.function.name.toLowerCase() !== 'not') {
                            if (cleanUnused(node, usageData)) {
                                shouldRemove = true;
                            }
                        }
                        break;

                    case 'ClassSelector':
                        if (usageData.allowlist !== null &&
                            usageData.allowlist.classes !== null &&
                            !hasOwnProperty.call(usageData.allowlist.classes, node.name)) {
                            shouldRemove = true;
                        }
                        if (usageData.blocklist !== null &&
                            usageData.blocklist.classes !== null &&
                            hasOwnProperty.call(usageData.blocklist.classes, node.name)) {
                            shouldRemove = true;
                        }
                        break;

                    case 'IdSelector':
                        if (usageData.allowlist !== null &&
                            usageData.allowlist.ids !== null &&
                            !hasOwnProperty.call(usageData.allowlist.ids, node.name)) {
                            shouldRemove = true;
                        }
                        if (usageData.blocklist !== null &&
                            usageData.blocklist.ids !== null &&
                            hasOwnProperty.call(usageData.blocklist.ids, node.name)) {
                            shouldRemove = true;
                        }
                        break;

                    case 'TypeSelector':
                        // TODO: remove toLowerCase when type selectors will be normalized
                        // ignore universal selectors
                        if (node.name.charAt(node.name.length - 1) !== '*') {
                            if (usageData.allowlist !== null &&
                                usageData.allowlist.tags !== null &&
                                !hasOwnProperty.call(usageData.allowlist.tags, node.name.toLowerCase())) {
                                shouldRemove = true;
                            }
                            if (usageData.blocklist !== null &&
                                usageData.blocklist.tags !== null &&
                                hasOwnProperty.call(usageData.blocklist.tags, node.name.toLowerCase())) {
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

module.exports = function cleanRule(node, item, list, options) {
    if (hasNoChildren(node.prelude) || hasNoChildren(node.block)) {
        list.remove(item);
        return;
    }

    var usageData = options.usage;

    if (usageData && (usageData.allowlist !== null || usageData.blocklist !== null)) {
        cleanUnused(node.prelude, usageData);

        if (hasNoChildren(node.prelude)) {
            list.remove(item);
            return;
        }
    }
};
