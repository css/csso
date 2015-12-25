var A = 2;
var B = 1;
var C = 0;

module.exports = function specificity(simpleSelector) {
    var specificity = [0, 0, 0];

    simpleSelector.sequence.forEach(function walk(item) {
        switch (item.type) {
            case 'SimpleSelector':
            case 'Negation':
                item.sequence.forEach(walk);
                break;

            case 'Id':
                specificity[C]++;
                break;

            case 'Class':
            case 'Attribute':
            case 'FunctionalPseudo':
                specificity[B]++;
                break;

            case 'Identifier':
                if (item.name !== '*') {
                    specificity[A]++;
                }
                break;

            case 'PseudoElement':
                specificity[A]++;
                break;

            case 'PseudoClass':
                var name = item.name.toLowerCase();
                if (name === 'before' ||
                    name === 'after' ||
                    name === 'first-line' ||
                    name === 'first-letter') {
                    specificity[A]++;
                } else {
                    specificity[B]++;
                }
                break;
        }
    });

    return specificity;
};
