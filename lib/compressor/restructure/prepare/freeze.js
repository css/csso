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
    var pseudos = {};
    var count = 0;

    node.selector.selectors.each(function(simpleSelector) {
        simpleSelector.sequence.each(function(node) {
            switch (node.type) {
                case 'PseudoClass':
                    if (!nonFreezePseudoClasses.hasOwnProperty(node.name)) {
                        pseudos[node.name] = true;
                        count++;
                    }
                    break;

                case 'PseudoElement':
                    if (!nonFreezePseudoElements.hasOwnProperty(node.name)) {
                        pseudos[node.name] = true;
                        count++;
                    }
                    break;

                case 'FunctionalPseudo':
                    pseudos[node.name] = true;
                    count++;
                    break;
            }
        });
    });

    if (count) {
        node.info.pseudoSignature = Object.keys(pseudos).sort().join(',');
    }
};
