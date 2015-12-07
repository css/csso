var translate = require('../ast/translate.js');
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

        // there is could be empty simple selector in selector list
        // TODO: remove this check, since those selectors are invalid
        if (!last) {
            return null;
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
