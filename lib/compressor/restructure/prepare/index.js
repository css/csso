var translate = require('../../ast/translate.js');
var specificity = require('./specificity.js');
var freeze = require('./freeze.js');

function processSimpleSelector(node) {
    var info = node.info;
    var tagName = '*';
    var list = node.sequence;
    var last = list.tail;

    while (last && last.prev && last.prev.data.type !== 'Combinator') {
        last = last.prev;
    }

    if (last && last.data.type === 'Identifier') {
        tagName = last.data.name;
    }

    info.compareMarker = specificity(node) + ',' + tagName;
    info.s = translate(node);
}

module.exports = function walk(node, markDeclaration) {
    switch (node.type) {
        case 'Ruleset':
            node.selector.selectors.each(processSimpleSelector);
            node.block.declarations.each(markDeclaration);
            freeze(node);
            break;

        case 'Atrule':
            if (node.expression) {
                node.expression.info.s = translate(node.expression);
            }

            // compare keyframe selectors by its values
            // NOTE: still no clarification about problems with keyframes selector grouping (issue #197)
            if (/^(-[a-z\d]+-)?keyframes$/.test(node.name)) {
                node.block.info.isKeyframes = true;
                node.block.rules.each(function(ruleset) {
                    ruleset.selector.selectors.each(function(simpleselector) {
                        simpleselector.info.compareMarker = simpleselector.info.s;
                    });
                });
            }
            break;
    }
};
