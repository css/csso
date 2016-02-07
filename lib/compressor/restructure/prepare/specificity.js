var A = 2;
var B = 1;
var C = 0;

module.exports = function specificity(simpleSelector) {
    var specificity = [0, 0, 0];

    simpleSelector.sequence.each(function walk(data) {
        switch (data.type) {
            case 'SimpleSelector':
            case 'Negation':
                data.sequence.each(walk);
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
                if (data.name !== '*') {
                    specificity[A]++;
                }
                break;

            case 'PseudoElement':
                specificity[A]++;
                break;

            case 'PseudoClass':
                var name = data.name.toLowerCase();
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
