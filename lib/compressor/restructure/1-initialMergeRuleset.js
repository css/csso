var utils = require('./utils.js');
var walkRules = require('../../utils/walk.js').rules;

function processRuleset(node, item, list) {
    var selectors = node.selector.selectors;
    var declarations = node.block.declarations;

    list.prevUntil(item.prev, function(prevNode) {
        // skip non-ruleset node if safe
        if (prevNode.type !== 'Ruleset') {
            return utils.unsafeToSkipNode.call(selectors, prevNode);
        }

        var prevSelectors = prevNode.selector.selectors;
        var prevDeclarations = prevNode.block.declarations;

        // try to join rulesets with equal pseudo signature
        if (node.pseudoSignature === prevNode.pseudoSignature) {
            // try to join by selectors
            if (utils.isEqualLists(prevSelectors, selectors)) {
                prevDeclarations.appendList(declarations);
                list.remove(item);
                return true;
            }

            // try to join by declarations
            if (utils.isEqualDeclarations(declarations, prevDeclarations)) {
                utils.addToSelector(prevSelectors, selectors);
                list.remove(item);
                return true;
            }
        }

        // go to next ruleset if simpleselectors has no equal specificity and element selector
        if (utils.hasSimilarProperties(declarations, prevDeclarations)) {
            return selectors.some(function(a) {
                return prevSelectors.some(function(b) {
                    return a.compareMarker === b.compareMarker;
                });
            });
        }
    });
};

// NOTE: direction should be left to right, since rulesets merge to left
// ruleset. When direction right to left unmerged rulesets may prevent lookup
// TODO: remove initial merge
module.exports = function initialMergeRuleset(ast) {
    walkRules(ast, function(node, item, list) {
        if (node.type === 'Ruleset') {
            processRuleset(node, item, list);
        }
    });
};
