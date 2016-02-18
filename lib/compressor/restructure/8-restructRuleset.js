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
        length += tokens[i].info.length;
    }

    return length;
}

module.exports = function restructRuleset(node, parent, list, item) {
    var selector = node.selector.selectors;
    var block = node.block;
    var skippedCompareMarkers = {};

    list.prevUntil(item.prev, function(prevNode, prevItem) {
        if (prevNode.type !== 'Ruleset') {
            return true;
        }

        var prevSelector = prevNode.selector.selectors;
        var prevBlock = prevNode.block;

        if (node.info.pseudoSignature !== prevNode.info.pseudoSignature) {
            return true;
        }

        // try prev ruleset if simpleselectors has no equal specifity and element selector
        var prevSelectorCursor = prevSelector.head;
        while (prevSelectorCursor) {
            if (prevSelectorCursor.data.info.compareMarker in skippedCompareMarkers) {
                return true;
            }

            prevSelectorCursor = prevSelectorCursor.next;
        }

        // try to join by selectors
        if (utils.isEqualLists(prevSelector, selector)) {
            prevBlock.declarations.insertList(block.declarations);
            list.remove(item);
            return true;
        }

        // try to join by properties
        var diff = utils.compareDeclarations(block.declarations, prevBlock.declarations);

        // console.log(diff.eq, diff.ne1, diff.ne2);

        if (diff.eq.length) {
            if (!diff.ne1.length && !diff.ne2.length) {
                // equal blocks
                utils.addToSelector(selector, prevSelector);
                list.remove(prevItem);
                return true;
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
                        list.insert(list.createItem(newRuleset), prevItem);
                        return true;
                    }
                }
            }
        }

        prevSelector.each(function(data) {
            skippedCompareMarkers[data.info.compareMarker] = true;
        });
    });
};
