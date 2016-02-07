var utils = require('./utils.js');

module.exports = function rejoinRuleset(node, parent, array, i) {
    var selector = node.selector.selectors;
    var block = node.block.declarations;

    if (!block.length) {
        return null;
    }

    var nodeCompareMarker = selector.first().info.compareMarker;
    var skippedCompareMarkers = {};

    for (i = i + 1; i < array.length; i++) {
        var next = array[i];

        if (next.type !== 'Ruleset') {
            return;
        }

        if (node.info.pseudoSignature !== next.info.pseudoSignature) {
            return;
        }

        var nextFirstSelector = next.selector.selectors.head;
        var nextBlock = next.block.declarations;
        var nextCompareMarker = nextFirstSelector.data.info.compareMarker;

        // if next ruleset has same marked as one of skipped then stop joining
        if (nextCompareMarker in skippedCompareMarkers) {
            return;
        }

        // try to join by selectors
        if (selector.head === selector.tail) {
            if (selector.first().info.s === nextFirstSelector.data.info.s) {
                block.push.apply(block, nextBlock);
                array.splice(i, 1);
                i--;

                continue;
            }
        }

        if (!utils.isCompatibleSignatures(node, next)) {
            return;
        }

        // try to join by properties
        if (block.length === nextBlock.length) {
            var equalBlocks = true;

            for (var j = 0; j < block.length; j++) {
                if (block[j].info.s !== nextBlock[j].info.s) {
                    equalBlocks = false;
                    break;
                }
            }

            if (equalBlocks) {
                var nextStr = nextFirstSelector.data.info.s;
                var cursor = selector.head;

                while (cursor) {
                    var curStr = cursor.data.info.s;

                    if (nextStr === curStr) {
                        break;
                    }

                    if (nextStr < curStr) {
                        selector.insert(nextFirstSelector, cursor);
                        break;
                    }

                    if (!cursor.next) {
                        selector.append(nextFirstSelector);
                        break;
                    }

                    cursor = cursor.next;
                }

                array.splice(i, 1);
                i--;

                continue;
            }
        }

        // go to next ruleset if current one can be skipped (has no equal specificity nor element selector)
        if (nextCompareMarker === nodeCompareMarker) {
            return;
        }

        skippedCompareMarkers[nextCompareMarker] = true;
    }
};
