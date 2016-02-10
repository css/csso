var List = require('../../utils/list.js');
var utils = require('./utils.js');

function calcListLength(list) {
    var length = 0;

    if (list.isEmpty()) {
        return 0;
    }

    list.each(function(data) {
        length += data.info.s.length + 1;
    });

    return length - 1;
}

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

    var skippedCompareMarkers = {};

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

        // try prev ruleset if simpleselectors has no equal specifity and element selector
        var prevSelectorCursor = prevSelector.head;
        while (prevSelectorCursor) {
            if (prevSelectorCursor.data.info.compareMarker in skippedCompareMarkers) {
                return;
            }

            prevSelectorCursor = prevSelectorCursor.next;
        }

        // try to join by selectors
        if (utils.isEqualLists(prevSelector, selector)) {
            prevBlock.declarations.insertList(block.declarations);
            return null;
        }

        // try to join by properties
        var diff = utils.compareRulesets(node, prevNode);

        // console.log(diff.eq, diff.ne1, diff.ne2);

        if (diff.eq.length) {
            if (!diff.ne1.length && !diff.ne2.length) {
                // equal blocks
                if (utils.isCompatibleSignatures(node, prevNode)) {
                    utils.addToSelector(selector, prevSelector);
                    array.splice(i, 1);
                    return;
                }
            } else if (!parent.info.isKeyframes) { /* probably we don't need to prevent those merges for @keyframes
                                                     TODO: need to be checked */

                if (diff.ne1.length && !diff.ne2.length) {
                    // prevBlock is subset block
                    var selectorLength = calcListLength(selector);
                    var blockLength = calcLength(diff.eq) + // declarations length
                                      diff.eq.length - 1; // decldelims length

                    if (selectorLength < blockLength) {
                        utils.addToSelector(prevSelector, selector);
                        node.block = {
                            type: 'Block',
                            info: block.info,
                            declarations: new List(diff.ne1)
                        };
                    }
                } else if (!diff.ne1.length && diff.ne2.length) {
                    // node is subset of prevBlock
                    var selectorLength = calcListLength(prevSelector);
                    var blockLength = calcLength(diff.eq) + // declarations length
                                      diff.eq.length - 1; // decldelims length

                    if (selectorLength < blockLength) {
                        utils.addToSelector(selector, prevSelector);
                        prevNode.block = {
                            type: 'Block',
                            info: prevBlock.info,
                            declarations: new List(diff.ne2)
                        };
                    }
                } else {
                    // diff.ne1.length && diff.ne2.length
                    // extract equal block
                    var newSelector = {
                        type: 'Selector',
                        info: {},
                        selectors: utils.addToSelector(prevSelector.copy(), selector)
                    };
                    var newSelectorLength = calcListLength(newSelector.selectors) + // selectors length
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
                                declarations: new List(diff.eq)
                            }
                        };

                        node.block = {
                            type: 'Block',
                            info: block.info,
                            declarations: new List(diff.ne1)
                        };
                        prevNode.block = {
                            type: 'Block',
                            info: prevBlock.info,
                            declarations: new List(diff.ne2.concat(diff.ne2overrided))
                        };
                        array.splice(i, 0, newRuleset);
                        return;
                    }
                }
            }
        }

        prevSelector.each(function(data) {
            skippedCompareMarkers[data.info.compareMarker] = true;
        });
    }
};
