var utils = require('./utils.js');

module.exports = function initialMergeRuleset(node, item, list) {
    var selectors = node.selector.selectors;
    var declarations = node.block.declarations;

    list.prevUntil(item.prev, function(prev) {
        if (prev.type !== 'Ruleset') {
            return true;
        }

        var prevSelectors = prev.selector.selectors;
        var prevDeclarations = prev.block.declarations;

        if (node.pseudoSignature === prev.pseudoSignature) {
            // try to join by selectors
            if (utils.isEqualLists(prevSelectors, selectors)) {
                prevDeclarations.appendList(declarations);
                list.remove(item);
                return true;
            }

            // try to join by declarations
            if (utils.isEqualLists(declarations, prevDeclarations)) {
                utils.addSelectors(prevSelectors, selectors);
                list.remove(item);
                return true;
            }
        }

        // go to next ruleset if simpleselectors has no equal specificity and element selector
        return selectors.some(function(a) {
            return prevSelectors.some(function(b) {
                return a.compareMarker === b.compareMarker;
            });
        });
    });
};
