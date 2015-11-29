var specificity = require('./specificity.js');
var freeze = require('./freeze.js');

function translate(node) {
    node.info.s = node.translate();
}

module.exports = {
    ruleset: function(node, root) {
        freeze(node);
        root.rulesetParents.add(node.parent.token);
    },

    simpleselector: function(node) {
        var info = node.info;
        var token = node.token;
        var tagName = '*';
        var last;

        for (var i = token.length - 1; i >= 2; i--) {
            if (token[i][1] === 'combinator' || token[i][1] === 's') {
                break;
            }

            last = token[i];
        }

        if (last[1] === 'ident') {
            tagName = last[2];
        }

        info.compareMarker = specificity(node) + ',' + tagName;
        // info.tagName = tagName;
        // info.specificity = specificity(node);
        info.s = node.translate();
    },

    declaration: translate,
    property: translate,
    value: translate,
    filter: translate
};
