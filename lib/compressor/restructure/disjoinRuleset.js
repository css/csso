var utils = require('./utils.js');

module.exports = function disjoin(node, parent, array, i) {
    var selectors = node.selector.selectors;

    // there are more than 1 simple selector split for rulesets
    if (selectors.length > 1) {
        // generate new rule sets:
        // .a, .b { color: red; }
        // ->
        // .a { color: red; }
        // .b { color: red; }
        for (var j = selectors.length - 1; j >= 1; j--) {
            array.splice(i + 1, 0, {
                type: 'Ruleset',
                info: utils.copyObject(node.info),
                selector: {
                    type: 'Selector',
                    info: utils.copyObject(node.selector.info),
                    selectors: [
                        selectors[j]
                    ]
                },
                block: {
                    type: 'Block',
                    info: utils.copyObject(node.block.info),
                    declarations: node.block.declarations.slice()
                }
            });
        }

        // delete all selectors except first one
        node.selector.selectors = [
            node.selector.selectors[0]
        ];
    }
};
