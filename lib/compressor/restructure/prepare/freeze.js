var nonFreezePseudoElements = new Set([
    'first-letter',
    'first-line',
    'after',
    'before'
]);
var nonFreezePseudoClasses = new Set([
    'link',
    'visited',
    'hover',
    'active',
    'first-letter',
    'first-line',
    'after',
    'before'
]);

module.exports = function freeze(node) {
    var pseudos = {};
    var count = 0;

    node.selector.selectors.each(function(simpleSelector) {
        simpleSelector.sequence.each(function(node) {
            switch (node.type) {
                case 'PseudoClass':
                    if (!nonFreezePseudoClasses.has(node.name)) {
                        pseudos[node.name] = true;
                        count++;
                    }
                    break;

                case 'PseudoElement':
                    if (!nonFreezePseudoElements.has(node.name)) {
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
