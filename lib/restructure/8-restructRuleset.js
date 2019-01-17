const { List, walk } = require('css-tree');
const utils = require('./utils');

function calcSelectorLength(list) {
    let length = 0;

    list.each(data => {
        length += data.id.length + 1;
    });

    return length - 1;
}

function calcDeclarationsLength(tokens) {
    let length = 0;

    for (let i = 0; i < tokens.length; i++) {
        length += tokens[i].length;
    }

    return (
        length + // declarations
        tokens.length - 1 // delimeters
    );
}

function processRule(node, item, list) {
    const avoidRulesMerge = this.block === null ? false : this.block.avoidRulesMerge;
    const selectors = node.prelude.children;
    const { block } = node;
    const disallowDownMarkers = Object.create(null);
    let allowMergeUp = true;
    let allowMergeDown = true;

    list.prevUntil(item.prev, (prev, prevItem) => {
        // skip non-ruleset node if safe
        if (prev.type !== 'Rule') {
            return utils.unsafeToSkipNode.call(selectors, prev);
        }

        const prevSelectors = prev.prelude.children;
        const prevBlock = prev.block;

        if (node.pseudoSignature !== prev.pseudoSignature) {
            return true;
        }

        allowMergeDown = !prevSelectors.some(selector => {
            return selector.compareMarker in disallowDownMarkers;
        });

        // try prev ruleset if simpleselectors has no equal specifity and element selector
        if (!allowMergeDown && !allowMergeUp) {
            return true;
        }

        // try to join by selectors
        if (allowMergeUp && utils.isEqualSelectors(prevSelectors, selectors)) {
            prevBlock.children.appendList(block.children);
            list.remove(item);
            return true;
        }

        // try to join by properties
        const diff = utils.compareDeclarations(block.children, prevBlock.children);

        // console.log(diff.eq, diff.ne1, diff.ne2);

        if (diff.eq.length) {
            if (!diff.ne1.length && !diff.ne2.length) {
                // equal blocks
                if (allowMergeDown) {
                    utils.addSelectors(selectors, prevSelectors);
                    list.remove(prevItem);
                }

                return true;
            }

            /* probably we don't need to prevent those merges for @keyframes
            TODO: need to be checked */
            if (!avoidRulesMerge) {
                if (diff.ne1.length && !diff.ne2.length) {
                    // prevBlock is subset block
                    const selectorLength = calcSelectorLength(selectors);
                    const blockLength = calcDeclarationsLength(diff.eq); // declarations length

                    if (allowMergeUp && selectorLength < blockLength) {
                        utils.addSelectors(prevSelectors, selectors);
                        block.children = new List().fromArray(diff.ne1);
                    }
                } else if (!diff.ne1.length && diff.ne2.length) {
                    // node is subset of prevBlock
                    const selectorLength = calcSelectorLength(prevSelectors);
                    const blockLength = calcDeclarationsLength(diff.eq); // declarations length

                    if (allowMergeDown && selectorLength < blockLength) {
                        utils.addSelectors(selectors, prevSelectors);
                        prevBlock.children = new List().fromArray(diff.ne2);
                    }
                } else {
                    // diff.ne1.length && diff.ne2.length
                    // extract equal block
                    const newSelector = {
                        type: 'SelectorList',
                        loc: null,
                        children: utils.addSelectors(prevSelectors.copy(), selectors)
                    };
                    const newBlockLength = calcSelectorLength(newSelector.children) + 2; // selectors length + curly braces length
                    const blockLength = calcDeclarationsLength(diff.eq); // declarations length

                    // create new ruleset if declarations length greater than
                    // ruleset description overhead
                    if (allowMergeDown && blockLength >= newBlockLength) {
                        const newRule = {
                            type: 'Rule',
                            loc: null,
                            prelude: newSelector,
                            block: {
                                type: 'Block',
                                loc: null,
                                children: new List().fromArray(diff.eq)
                            },
                            pseudoSignature: node.pseudoSignature
                        };

                        block.children = new List().fromArray(diff.ne1);
                        prevBlock.children = new List().fromArray(diff.ne2overrided);
                        list.insert(list.createItem(newRule), prevItem);
                        return true;
                    }
                }
            }
        }

        if (allowMergeUp) {
            // TODO: disallow up merge only if any property interception only (i.e. diff.ne2overrided.length > 0);
            // await property families to find property interception correctly
            allowMergeUp = !prevSelectors.some(prevSelector => {
                return selectors.some(selector => {
                    return selector.compareMarker === prevSelector.compareMarker;
                });
            });
        }

        prevSelectors.each(data => {
            disallowDownMarkers[data.compareMarker] = true;
        });
    });
}

module.exports = function restructRule(ast) {
    walk(ast, {
        visit: 'Rule',
        reverse: true,
        enter: processRule
    });
};
