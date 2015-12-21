var translate = require('../../ast/translate.js');
var specificity = require('./specificity.js');
var freeze = require('./freeze.js');

function translateNode(node) {
    node.info.s = translate(node);
}

var handlers = {
    Ruleset: freeze,

    Atrule: function(node, root) {
        var name = node.name;

        // compare keyframe selectors by its values
        // NOTE: still no clarification about problems with keyframes selector grouping (issue #197)
        if (/^(-[a-z\d]+-)?keyframes$/.test(name)) {
            node.block.rules.forEach(function(ruleset) {
                ruleset.selector.selectors.forEach(function(simpleselector) {
                    simpleselector.info.compareMarker = simpleselector.info.s;
                });
            });
        }
    },

    SimpleSelector: function(node) {
        var info = node.info;
        var array = node.sequence;
        var tagName = '*';
        var last;

        for (var i = array.length - 1; i >= 0; i--) {
            if (array[i].type === 'Combinator') {
                break;
            }

            last = array[i];
        }

        if (last.type === 'Identifier') {
            tagName = last.name;
        }

        info.compareMarker = specificity(node) + ',' + tagName;
        info.s = translate(node);
    },

    AtruleExpression: translateNode,
    Declaration: translateNode,
    Property: translateNode,
    Value: translateNode
};

module.exports = function(node, parent) {
    if (handlers[node.type]) {
        return handlers[node.type].call(this, node, parent);
    }
};
