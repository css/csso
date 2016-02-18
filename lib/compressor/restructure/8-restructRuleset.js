var List = require('../../utils/list.js');
var utils = require('./utils.js');

function calcSelectorLength(list) {
    var length = 0;

    if (list.isEmpty()) {
        return 0;
    }

    list.each(function(data) {
        length += data.info.s.length + 1;
    });

    return length - 1;
}

function calcDeclarationsLength(tokens) {
    var length = 0;

    for (var i = 0; i < tokens.length; i++) {
        length += tokens[i].info.length;
    }

    return (
        length +          // declarations
        tokens.length - 1 // delimeters
    );
}

module.exports = function restructRuleset(node, parent, list, item) {
    var selector = node.selector.selectors;
    var block = node.block;
    var skippedCompareMarkers = Object.create(null);

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
                    var selectorLength = calcSelectorLength(selector);
                    var blockLength = calcDeclarationsLength(diff.eq); // declarations length

                    if (selectorLength < blockLength) {
                        utils.addToSelector(prevSelector, selector);
                        node.block.declarations = new List(diff.ne1);
                    }
                } else if (!diff.ne1.length && diff.ne2.length) {
                    // node is subset of prevBlock
                    var selectorLength = calcSelectorLength(prevSelector);
                    var blockLength = calcDeclarationsLength(diff.eq); // declarations length

                    if (selectorLength < blockLength) {
                        utils.addToSelector(selector, prevSelector);
                        prevNode.block.declarations = new List(diff.ne2);
                    }
                } else {
                    // diff.ne1.length && diff.ne2.length
                    // extract equal block
                    var newSelector = {
                        type: 'Selector',
                        info: {},
                        selectors: utils.addToSelector(prevSelector.copy(), selector)
                    };
                    var newBlockLength = calcSelectorLength(newSelector.selectors) + 2; // selectors length + curly braces length
                    var blockLength = calcDeclarationsLength(diff.eq); // declarations length

                    // create new ruleset if declarations length greater than
                    // ruleset description overhead
                    if (blockLength >= newBlockLength) {
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

                        node.block.declarations = new List(diff.ne1);
                        prevNode.block.declarations = new List(diff.ne2.concat(diff.ne2overrided));
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
