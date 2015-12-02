var utils = require('../utils.js');

module.exports = function rejoinRuleset(token, parent, i) {
    var selector = token[2];
    var block = token[3];
    var info = token[0];

    if (block.length === 2) {
        return null;
    }

    for (i = i - 1; i >= 2; i--) {
        var prev = parent[i];

        if (prev[1] !== 'ruleset') {
            return;
        }

        var prevSelector = prev[2];
        var prevBlock = prev[3];

        if (info.pseudoSignature !== prev[0].pseudoSignature) {
            return;
        }

        // try to join by selectors
        var prevHash = utils.getHash(prevSelector);
        var hash = utils.getHash(selector);

        if (utils.equalHash(hash, prevHash)) {
            utils.append(prevBlock, block);
            return null;
        }

        if (!utils.isCompatibleSignatures(token, prev)) {
            return;
        }

        // try to join by properties
        var diff = utils.compareRulesets(token, prev);
        if (!diff.ne1.length && !diff.ne2.length) {
            utils.addToSelector(prevSelector, selector);

            return null;
        }

        // go to next ruleset if simpleselectors has no equal specifity and element selector
        for (var j = 2; j < prevSelector.length; j++) {
            for (var k = 2; k < selector.length; k++) {
                if (prevSelector[j][0].compareMarker === selector[k][0].compareMarker) {
                    return;
                }
            }
        }
    }
};
