var translate = require('../../ast/translate.js');
var specificity = require('./specificity.js');
var freeze = require('./freeze.js');

function translateNode(node) {
    node.info.s = translate(node);
}

var handlers = {
    Ruleset: freeze,

    Atrule: function(node) {
        var name = node.name;

        // compare keyframe selectors by its values
        // NOTE: still no clarification about problems with keyframes selector grouping (issue #197)
        if (/^(-[a-z\d]+-)?keyframes$/.test(name)) {
            node.block.info.isKeyframes = true;
            node.block.rules.each(function(ruleset) {
                ruleset.selector.selectors.each(function(simpleselector) {
                    simpleselector.info.compareMarker = simpleselector.info.s;
                });
            });
        }
    },

    SimpleSelector: function(node) {
        var info = node.info;
        var tagName = '*';
        var list = node.sequence;
        var last = list.tail;

        while (last && last.prev && last.prev.data.type !== 'Combinator') {
            last = last.next;
        }

        if (last && last.data.type === 'Identifier') {
            tagName = last.data.name;
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
