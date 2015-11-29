var specificity = require('./specificity.js');
var freeze = require('./freeze.js');

function translate(node) {
    node.info.s = node.translate();
}

module.exports = {
    simpleselector: function(node) {
        var info = node.info;

        info.specificity = specificity(node);
        info.s = node.translate();
    },

    declaration: translate,
    property: translate,
    value: translate,
    filter: translate,

    ruleset: function(node, root) {
        freeze(node);
        root.rulesetParents.add(node.parent.token);
    }
};
