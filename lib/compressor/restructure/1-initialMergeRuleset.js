var utils = require('./utils.js');

// check if simpleselectors has no equal specificity and element selector
function hasSimilarSelectors(selectors1, selectors2) {
    return selectors1.some(function(a) {
        return selectors2.some(function(b) {
            return a.compareMarker === b.compareMarker;
        });
    });
}

// test node can't to be skipped
function unsafeToSkipNode(node) {
    switch (node.type) {
        case 'Ruleset':
            // unsafe skip ruleset with selector similarities
            return hasSimilarSelectors(node.selector.selectors, this);

        case 'Atrule':
            // can skip blocks with stylesheet block
            if (node.block && node.block.type === 'StyleSheet') {
                // unsafe skip at-rule if block contains something unsafe to skip
                return node.block.rules.some(unsafeToSkipNode, this);
            }
            break;
    }

    // unsafe by default
    return true;
}

module.exports = function initialMergeRuleset(node, item, list) {
    var selectors = node.selector.selectors;
    var declarations = node.block.declarations;

    list.prevUntil(item.prev, function(prev) {
        // skip non-ruleset node if safe
        if (prev.type !== 'Ruleset') {
            return unsafeToSkipNode.call(selectors, prev);
        }

        var prevSelectors = prev.selector.selectors;
        var prevDeclarations = prev.block.declarations;

        // try to join rulesets with equal pseudo signature
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

        // go to prev ruleset if has no selector similarities
        return hasSimilarSelectors(selectors, prevSelectors);
    });
};
