var utils = require('./utils.js');

module.exports = function rejoinRuleset(node, parent, array, i) {
    var selector = node.selector.selectors;
    var block = node.block.declarations;

    if (!block.length) {
        return null;
    }

    var compareMarkers = {};
    compareMarkers[selector[0].info.compareMarker] = true;

    for (i = i + 1; i < array.length; i++) {
        var next = array[i];

        if (next.type !== 'Ruleset') {
            return;
        }

        if (node.info.pseudoSignature !== next.info.pseudoSignature) {
            return;
        }

        var nextFirstSelector = next.selector.selectors[0];
        var nextBlock = next.block.declarations;

        // try to join by selectors
        if (selector.length === 1) {
            if (selector[0].info.s === nextFirstSelector.info.s) {
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
        var nextCompareMarker = nextFirstSelector.info.compareMarker;
        var equalBlocks = true;

        if (block.length === nextBlock.length) {
            for (var j = 0; j < block.length; j++) {
                if (block[j].info.s !== nextBlock[j].info.s) {
                    equalBlocks = false;
                    break;
                }
            }

            if (equalBlocks) {
                var nextStr = nextFirstSelector.info.s;

                for (var j = selector.length; j >= 0; j--) {
                    if (!j || nextStr > selector[j - 1].info.s) {
                        selector.splice(j, 0, nextFirstSelector);
                        break;
                    }
                }

                compareMarkers[nextCompareMarker] = true;
                array.splice(i, 1);
                i--;

                continue;
            }
        }

        // go to next ruleset if simpleselectors has no equal specifity and element selector
        if (nextCompareMarker in compareMarkers) {
            return;
        }
    }
};
