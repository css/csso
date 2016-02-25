var List = require('../../utils/list.js');
var utils = require('./utils.js');

function calcSelectorLength(list) {
    var length = 0;

    list.each(function(data) {
        length += data.id.length + 1;
    });

    return length - 1;
}

function calcDeclarationsLength(tokens) {
    var length = 0;

    for (var i = 0; i < tokens.length; i++) {
        length += tokens[i].length;
    }

    return (
        length +          // declarations
        tokens.length - 1 // delimeters
    );
}

module.exports = function restructRuleset(node, item, list) {
    var avoidRulesMerge = this.stylesheet.avoidRulesMerge;
    var selector = node.selector.selectors;
    var block = node.block;
    var skippedCompareMarkers = Object.create(null);

    list.prevUntil(item.prev, function(prev, prevItem) {
        if (prev.type !== 'Ruleset') {
            return true;
        }

        var prevSelector = prev.selector.selectors;
        var prevBlock = prev.block;

        if (node.pseudoSignature !== prev.pseudoSignature) {
            return true;
        }

        // try prev ruleset if simpleselectors has no equal specifity and element selector
        var prevSelectorCursor = prevSelector.head;
        while (prevSelectorCursor) {
            if (prevSelectorCursor.data.compareMarker in skippedCompareMarkers) {
                return true;
            }

            prevSelectorCursor = prevSelectorCursor.next;
        }

        // try to join by selectors
        if (utils.isEqualLists(prevSelector, selector)) {
            prevBlock.declarations.appendList(block.declarations);
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
            } else if (!avoidRulesMerge) { /* probably we don't need to prevent those merges for @keyframes
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
                        prev.block.declarations = new List(diff.ne2);
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
                            pseudoSignature: node.pseudoSignature,
                            selector: newSelector,
                            block: {
                                type: 'Block',
                                info: {},
                                declarations: new List(diff.eq)
                            }
                        };

                        node.block.declarations = new List(diff.ne1);
                        prev.block.declarations = new List(diff.ne2.concat(diff.ne2overrided));
                        list.insert(list.createItem(newRuleset), prevItem);
                        return true;
                    }
                }
            }
        }

        prevSelector.each(function(data) {
            skippedCompareMarkers[data.compareMarker] = true;
        });
    });
};
