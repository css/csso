var utils = require('../utils.js');

module.exports = function disjoin(token, parent, i) {
    var selector = token[2];

    // there are more than 1 simple selector split for rulesets
    if (selector.length > 3) {
        // generate new rule sets:
        // .a, .b { color: red; }
        // ->
        // .a { color: red; }
        // .b { color: red; }
        for (var j = selector.length - 1; j > 2; j--) {
            parent.splice(i + 1, 0, [
                utils.copyObject(token[0]),
                'ruleset',
                [
                    utils.copyObject(selector[0]),
                    'selector',
                    selector[j]
                ],
                utils.copyArray(token[3])
            ]);
        }

        // delete all selectors except first one
        selector.splice(3);
    }
};
