var utils = require('../utils.js');

function calcLength(tokens, offset) {
    var length = 0;

    for (var i = offset; i < tokens.length; i++) {
        length += tokens[i][0].s.length;
    }

    return length;
}

module.exports = function restructureRuleset(token, parent, i) {
    var selector = token[2];
    var block = token[3];
    var info = token[0];

    for (i = i - 1; i >= 2; i--) {
        var prevToken = parent[i];

        if (prevToken[1] !== 'ruleset') {
            return;
        }

        var prevSelector = prevToken[2];
        var prevBlock = prevToken[3];

        if (info.pseudoSignature !== prevToken[0].pseudoSignature) {
            return;
        }

        // try to join by selectors
        var prevHash = utils.getHash(prevSelector);
        var hash = utils.getHash(selector);

        if (utils.equalHash(hash, prevHash)) {
            utils.append(prevBlock, block);
            return null;
        }

        // try to join by properties
        var diff = utils.compareRulesets(token, prevToken);

        // console.log(diff.eq.length, diff.ne1.length, diff.ne2.length);

        if (diff.eq.length) {
            if (!diff.ne1.length && !diff.ne2.length) {
                if (utils.isCompatibleSignatures(token, prevToken)) {
                    utils.addToSelector(prevSelector, selector);
                    return null;
                }
            } else {
                if (diff.ne1.length && !diff.ne2.length) {
                    // prevBlock is subset block
                    var simpleSelectorCount = selector.length - 2; // - type and info
                    var selectorLength = calcLength(selector, 2) + // selectors length
                                         simpleSelectorCount - 1; // delims count
                    var blockLength = calcLength(diff.eq, 0) + // declarations length
                                      diff.eq.length - 1; // decldelims length

                    if (selectorLength < blockLength) {
                        utils.addToSelector(prevSelector, selector);
                        token[3] = [block[0], block[1]].concat(diff.ne1);
                    }
                } else if (!diff.ne1.length && diff.ne2.length) {
                    // token is subset of prevBlock
                    var simpleSelectorCount = prevSelector.length - 2; // - type and info
                    var selectorLength = calcLength(prevSelector, 2) + // selectors length
                                         simpleSelectorCount - 1; // delims count
                    var blockLength = calcLength(diff.eq, 0) + // declarations length
                                      diff.eq.length - 1; // decldelims length

                    if (selectorLength < blockLength) {
                        utils.addToSelector(selector, prevSelector);
                        prevToken[3] = [prevBlock[0], prevBlock[1]].concat(diff.ne2);
                    }
                } else {
                    // diff.ne1.length && diff.ne2.length
                    // extract equal block
                    var newSelector = utils.addToSelector(utils.copyArray(prevSelector), selector);
                    var newSelectorLength = calcLength(newSelector, 2) + // selectors length
                                            newSelector.length - 1 + // delims length
                                            2; // braces length
                    var blockLength = calcLength(diff.eq, 0) + // declarations length
                                      diff.eq.length - 1; // decldelims length

                    // ok, it's good enough to extract
                    if (blockLength >= newSelectorLength) {
                        var newRuleset = [
                            {},
                            'ruleset',
                            newSelector,
                            [{}, 'block'].concat(diff.eq)
                        ];

                        token[3] = [block[0], block[1]].concat(diff.ne1);
                        prevToken[3] = [prevBlock[0], prevBlock[1]].concat(diff.ne2);
                        parent.splice(i, 0, newRuleset);
                        return newRuleset;
                    }
                }
            }
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
