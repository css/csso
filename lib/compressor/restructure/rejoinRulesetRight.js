var utils = require('./utils.js');

module.exports = function rejoinRuleset(node, parent, array, i) {
    var selector = node.selector.selectors;
    var block = node.block;

    if (!block.declarations.length) {
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
        var prevHash = utils.getHash(prevSelector);
        var hash = utils.getHash(selector);

        if (utils.equalHash(hash, prevHash)) {
            prevBlock.declarations.push.apply(prevBlock.declarations, block.declarations);
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

        // go to next ruleset if simpleselectors has no equal specifity and element selector
        for (var j = 0; j < prevSelector.length; j++) {
            for (var k = 0; k < selector.length; k++) {
                if (prevSelector[j].info.compareMarker === selector[k].info.compareMarker) {
                    return;
                }
            }
        }
    }
};
