var translate = require('../../ast/translate.js');
var specificity = require('./specificity.js');

var nonFreezePseudoElements = {
    'first-letter': true,
    'first-line': true,
    'after': true,
    'before': true
};
var nonFreezePseudoClasses = {
    'link': true,
    'visited': true,
    'hover': true,
    'active': true,
    'first-letter': true,
    'first-line': true,
    'after': true,
    'before': true
};

module.exports = function freeze(node) {
    var pseudos = Object.create(null);
    var hasPseudo = false;

    node.selector.selectors.each(function(simpleSelector) {
        var list = simpleSelector.sequence;
        var last = list.tail;
        var tagName = '*';

        while (last && last.prev && last.prev.data.type !== 'Combinator') {
            last = last.prev;
        }

        if (last && last.data.type === 'Identifier') {
            tagName = last.data.name;
        }

        simpleSelector.compareMarker = specificity(simpleSelector) + ',' + tagName;
        simpleSelector.id = translate(simpleSelector);

        simpleSelector.sequence.each(function(node) {
            switch (node.type) {
                case 'PseudoClass':
                    if (!nonFreezePseudoClasses.hasOwnProperty(node.name)) {
                        pseudos[node.name] = true;
                        hasPseudo = true;
                    }
                    break;

                case 'PseudoElement':
                    if (!nonFreezePseudoElements.hasOwnProperty(node.name)) {
                        pseudos[node.name] = true;
                        hasPseudo = true;
                    }
                    break;

                case 'FunctionalPseudo':
                    pseudos[node.name] = true;
                    hasPseudo = true;
                    break;
            }
        });
    });

    if (hasPseudo) {
        node.pseudoSignature = Object.keys(pseudos).sort().join(',');
    }
};
