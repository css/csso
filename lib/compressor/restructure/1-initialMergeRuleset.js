var utils = require('./utils.js');

module.exports = function initialMergeRuleset(node, item, list) {
    var selector = node.selector.selectors;
    var block = node.block;

    list.prevUntil(item.prev, function(prev) {
        if (prev.type !== 'Ruleset') {
            return true;
        }

        if (node.pseudoSignature !== prev.pseudoSignature) {
            return true;
        }

        var prevSelector = prev.selector.selectors;
        var prevBlock = prev.block;

        // try to join by selectors
        if (utils.isEqualLists(prevSelector, selector)) {
            prevBlock.declarations.appendList(block.declarations);
            list.remove(item);
            return true;
        }

        // try to join by properties
        var diff = utils.compareDeclarations(block.declarations, prevBlock.declarations);

        if (!diff.ne1.length && !diff.ne2.length) {
            utils.addToSelector(prevSelector, selector);
            list.remove(item);
            return true;
        }

        // go to next ruleset if simpleselectors has no equal specificity and element selector
        return selector.some(function(a) {
            return prevSelector.some(function(b) {
                return a.compareMarker === b.compareMarker;
            });
        });
    });
};
