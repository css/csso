var utils = require('./utils.js');

module.exports = function initialMErgeRuleset(node, parent, list, item) {
    var selector = node.selector.selectors;
    var block = node.block;

    list.prevUntil(item.prev, function(prev, prevItem) {
        if (prev.type !== 'Ruleset') {
            return true;
        }

        var prevSelector = prev.selector.selectors;
        var prevBlock = prev.block;

        if (node.info.pseudoSignature !== prev.info.pseudoSignature) {
            return true;
        }

        // try to join by selectors
        if (utils.isEqualLists(prevSelector, selector)) {
            prevBlock.declarations.insertList(block.declarations);
            list.remove(item);
            return true;
        }

        if (!utils.isCompatibleSignatures(node, prev)) {
            return true;
        }

        // try to join by properties
        var diff = utils.compareRulesets(node, prev);

        if (!diff.ne1.length && !diff.ne2.length) {
            utils.addToSelector(prevSelector, selector);
            list.remove(item);
            return true;
        }

        // go to next ruleset if simpleselectors has no equal specificity and element selector
        return selector.some(function(a) {
            return prevSelector.some(function(b) {
                return a.info.compareMarker === b.info.compareMarker;
            });
        });
    });
};
