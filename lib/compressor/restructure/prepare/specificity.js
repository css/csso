module.exports = function specificity(simpleSelector) {
    var A = 0;
    var B = 0;
    var C = 0;

    simpleSelector.sequence.each(function walk(node) {
        switch (node.type) {
            case 'SimpleSelector':
            case 'Negation':
                node.sequence.each(walk);
                break;

            case 'Id':
                A++;
                break;

            case 'Class':
            case 'Attribute':
            case 'PseudoClass':
                B++;
                break;

            case 'Type':
            case 'PseudoElement':
                C++;
                break;
        }
    });

    return [A, B, C];
};
