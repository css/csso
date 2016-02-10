var utils = require('./utils.js');

module.exports = function rejoinRuleset(node, parent, array, i) {
    var selector = node.selector.selectors;
    var block = node.block;

    if (block.declarations.isEmpty()) {
        return null;
    }

    for (i = i - 1; i >= 0; i--) {
        var prev = array[i];

        if (prev.type !== 'Ruleset') {
            return;
        }

        var prevSelector = prev.selector.selectors;
        var prevBlock = prev.block;

        if (node.info.pseudoSignature !== prev.info.pseudoSignature) {
            return;
        }

        // try to join by selectors
        if (utils.isEqualLists(prevSelector, selector)) {
            prevBlock.declarations.insertList(block.declarations);
            return null;
        }

        if (!utils.isCompatibleSignatures(node, prev)) {
            return;
        }

        // try to join by properties
        var diff = utils.compareRulesets(node, prev);

        if (!diff.ne1.length && !diff.ne2.length) {
            utils.addToSelector(prevSelector, selector);

            return null;
        }

        // go to next ruleset if simpleselectors has no equal specificity and element selector
        var hasEqualSpecificity = selector.some(function(a) {
            return prevSelector.some(function(b) {
                return a.info.compareMarker === b.info.compareMarker;
            });
        });

        if (hasEqualSpecificity) {
            return;
        }
    }
};
