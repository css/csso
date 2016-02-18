var utils = require('./utils.js');
var List = require('../../utils/list.js');

module.exports = function disjoin(node, item, list) {
    var selectors = node.selector.selectors;

    // generate new rule sets:
    // .a, .b { color: red; }
    // ->
    // .a { color: red; }
    // .b { color: red; }

    // while there are more than 1 simple selector split for rulesets
    while (selectors.head !== selectors.tail) {
        list.insert(list.createItem({
            type: 'Ruleset',
            info: utils.copyObject(node.info),
            selector: {
                type: 'Selector',
                info: utils.copyObject(node.selector.info),
                selectors: selectors.extract(null, selectors.head)
            },
            block: {
                type: 'Block',
                info: utils.copyObject(node.block.info),
                declarations: node.block.declarations.copy()
            }
        }), item);
    }
};
