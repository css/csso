var List = require('../../utils/list.js');
var utils = require('./utils.js');
var walkRulesRight = require('../../utils/walk.js').rulesRight;

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

function inList(selector) {
    return selector.compareMarker in this;
}

function processRuleset(node, item, list) {
    var avoidRulesMerge = this.stylesheet.avoidRulesMerge;
    var selectors = node.selector.selectors;
    var block = node.block;
    var skippedCompareMarkers = Object.create(null);

    list.prevUntil(item.prev, function(prevNode, prevItem) {
        // skip non-ruleset node if safe
        if (prevNode.type !== 'Ruleset') {
            return utils.unsafeToSkipNode.call(selectors, prevNode);
        }

        var prevSelectors = prevNode.selector.selectors;
        var prevBlock = prevNode.block;

        if (node.pseudoSignature !== prevNode.pseudoSignature) {
            return true;
        }

        // try prev ruleset if simpleselectors has no equal specifity and element selector
        if (prevSelectors.some(inList, skippedCompareMarkers)) {
            return true;
        }

        // try to join by selectors
        if (utils.isEqualLists(prevSelectors, selectors)) {
            prevBlock.declarations.appendList(block.declarations);
            list.remove(item);
            return true;
        }

        // try to join by properties
        if (utils.hasSimilarProperties(block.declarations, prevBlock.declarations)) {
            // try prevNode ruleset if simpleselectors has no equal specifity and element selector
            var prevSelectorCursor = prevSelectors.head;
            while (prevSelectorCursor) {
                if (prevSelectorCursor.data.compareMarker in skippedCompareMarkers) {
                    return true;
                }

                prevSelectorCursor = prevSelectorCursor.next;
            }

            var diff = utils.compareDeclarations(block.declarations, prevBlock.declarations);

            // console.log(diff.eq, diff.ne1, diff.ne2);

            if (diff.eq.length) {
                if (!diff.ne1.length && !diff.ne2.length) {
                    // equal blocks
                    utils.addToSelector(selectors, prevSelectors);
                    list.remove(prevItem);
                    return true;
                } else if (!avoidRulesMerge) { /* probably we don't need to prevent those merges for @keyframes
                                                  TODO: need to be checked */

                    if (diff.ne1.length && !diff.ne2.length) {
                        // prevBlock is subset block
                        var selectorLength = calcSelectorLength(selectors);
                        var blockLength = calcDeclarationsLength(diff.eq); // declarations length

                        if (selectorLength < blockLength) {
                            utils.addToSelector(prevSelectors, selectors);
                            node.block.declarations = new List(diff.ne1);
                        }
                    } else if (!diff.ne1.length && diff.ne2.length) {
                        // node is subset of prevBlock
                        var selectorLength = calcSelectorLength(prevSelectors);
                        var blockLength = calcDeclarationsLength(diff.eq); // declarations length

                        if (selectorLength < blockLength) {
                            utils.addToSelector(selectors, prevSelectors);
                            prevNode.block.declarations = new List(diff.ne2);
                        }
                    } else {
                        // diff.ne1.length && diff.ne2.length
                        // extract equal block
                        var newSelector = {
                            type: 'Selector',
                            info: {},
                            selectors: utils.addToSelector(prevSelectors.copy(), selectors)
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
                            prevNode.block.declarations = new List(diff.ne2.concat(diff.ne2overrided));
                            list.insert(list.createItem(newRuleset), prevItem);
                            return true;
                        }
                    }
                }
            }

            prevSelectors.each(function(data) {
                skippedCompareMarkers[data.compareMarker] = true;
            });
        }
    });
};

module.exports = function restructRuleset(ast) {
    walkRulesRight(ast, function(node, item, list) {
        if (node.type === 'Ruleset') {
            processRuleset.call(this, node, item, list);
        }
    });
};
