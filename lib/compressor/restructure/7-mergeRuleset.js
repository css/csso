var utils = require('./utils.js');

module.exports = function mergeRuleset(node, item, list) {
    var selector = node.selector.selectors;
    var block = node.block.declarations;

    if (block.isEmpty()) {
        list.remove(item);
        return;
    }

    var nodeCompareMarker = selector.first().info.compareMarker;
    var skippedCompareMarkers = {};

    list.nextUntil(item.next, function(next, nextItem) {
        if (next.type !== 'Ruleset') {
            return true;
        }

        if (node.info.pseudoSignature !== next.info.pseudoSignature) {
            return true;
        }

        var nextFirstSelector = next.selector.selectors.head;
        var nextBlock = next.block.declarations;
        var nextCompareMarker = nextFirstSelector.data.info.compareMarker;

        // if next ruleset has same marked as one of skipped then stop joining
        if (nextCompareMarker in skippedCompareMarkers) {
            return true;
        }

        // try to join by selectors
        if (selector.head === selector.tail) {
            if (selector.first().info.s === nextFirstSelector.data.info.s) {
                block.insertList(nextBlock);
                list.remove(nextItem);
                return;
            }
        }

        // try to join by properties
        if (utils.isEqualLists(block, nextBlock)) {
            var nextStr = nextFirstSelector.data.info.s;

            selector.some(function(data, item) {
                var curStr = data.info.s;

                if (nextStr === curStr) {
                    return true;
                }

                if (nextStr < curStr) {
                    selector.insert(nextFirstSelector, item);
                    return true;
                }

                if (!item.next) {
                    selector.append(nextFirstSelector);
                    return true;
                }
            });

            list.remove(nextItem);
            return;
        }

        // go to next ruleset if current one can be skipped (has no equal specificity nor element selector)
        if (nextCompareMarker === nodeCompareMarker) {
            return true;
        }

        skippedCompareMarkers[nextCompareMarker] = true;
    });
};
