var utils = require('./utils.js');

function calcLength(tokens) {
    var length = 0;

    for (var i = 0; i < tokens.length; i++) {
        length += tokens[i].info.s.length;
    }

    return length;
}

module.exports = function restructureRuleset(node, parent, array, i) {
    var selector = node.selector.selectors;
    var block = node.block;

    for (i = i - 1; i >= 0; i--) {
        var prevNode = array[i];

        if (prevNode.type !== 'Ruleset') {
            return;
        }

        var prevSelector = prevNode.selector.selectors;
        var prevBlock = prevNode.block;

        if (node.info.pseudoSignature !== prevNode.info.pseudoSignature) {
            return;
        }

        // try to join by selectors
        var prevHash = utils.getHash(prevSelector);
        var hash = utils.getHash(selector);

        if (utils.equalHash(hash, prevHash)) {
            prevBlock.declarations.push.apply(prevBlock.declarations, block.declarations);
            return null;
        }

        // try to join by properties
        var diff = utils.compareRulesets(node, prevNode);

        // console.log(diff.eq, diff.ne1, diff.ne2);

        if (diff.eq.length) {
            if (!diff.ne1.length && !diff.ne2.length) {
                if (utils.isCompatibleSignatures(node, prevNode)) {
                    utils.addToSelector(prevSelector, selector);
                    return null;
                }
            } else {
                if (diff.ne1.length && !diff.ne2.length) {
                    // prevBlock is subset block
                    var simpleSelectorCount = selector.length - 2; // - type and info
                    var selectorLength = calcLength(selector) + // selectors length
                                         simpleSelectorCount - 1; // delims count
                    var blockLength = calcLength(diff.eq) + // declarations length
                                      diff.eq.length - 1; // decldelims length

                    if (selectorLength < blockLength) {
                        utils.addToSelector(prevSelector, selector);
                        node.block = {
                            type: 'Block',
                            info: block.info,
                            declarations: diff.ne1
                        };
                    }
                } else if (!diff.ne1.length && diff.ne2.length) {
                    // node is subset of prevBlock
                    var simpleSelectorCount = prevSelector.length - 2; // - type and info
                    var selectorLength = calcLength(prevSelector) + // selectors length
                                         simpleSelectorCount - 1; // delims count
                    var blockLength = calcLength(diff.eq) + // declarations length
                                      diff.eq.length - 1; // decldelims length

                    if (selectorLength < blockLength) {
                        utils.addToSelector(selector, prevSelector);
                        prevNode.block = {
                            type: 'Block',
                            info: prevBlock.info,
                            declarations: diff.ne2
                        };
                    }
                } else {
                    // diff.ne1.length && diff.ne2.length
                    // extract equal block
                    var newSelector = {
                        type: 'Selector',
                        info: {},
                        selectors: utils.addToSelector(prevSelector.slice(), selector)
                    };
                    var newSelectorLength = calcLength(newSelector.selectors) + // selectors length
                                            newSelector.selectors.length - 1 + // delims length
                                            2; // braces length
                    var blockLength = calcLength(diff.eq) + // declarations length
                                      diff.eq.length - 1; // decldelims length

                    // ok, it's good enough to extract
                    if (blockLength >= newSelectorLength) {
                        var newRuleset = {
                            type: 'Ruleset',
                            info: {},
                            selector: newSelector,
                            block: {
                                type: 'Block',
                                info: {},
                                declarations: diff.eq
                            }
                        };

                        node.block = {
                            type: 'Block',
                            info: block.info,
                            declarations: diff.ne1
                        };
                        prevNode.block = {
                            type: 'Block',
                            info: prevBlock.info,
                            declarations: diff.ne2.concat(diff.ne2overrided)
                        };
                        array.splice(i, 0, newRuleset);
                        return;
                    }
                }
            }
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
