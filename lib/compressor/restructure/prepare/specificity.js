module.exports = function specificity(simpleSelector) {
    var A = 0;
    var B = 0;
    var C = 0;

    simpleSelector.children.each(function walk(node) {
        switch (node.type) {
            case 'SelectorList':
            case 'Selector':
                node.children.each(walk);
                break;

            case 'Id':
                A++;
                break;

            case 'Class':
            case 'Attribute':
                B++;
                break;

            case 'PseudoClass':
                switch (node.name.toLowerCase()) {
                    case 'not':
                        node.children.each(walk);
                        break;

                    case 'before':
                    case 'after':
                    case 'first-line':
                    case 'first-letter':
                        C++;
                        break;

                    // TODO: support for :nth-*(.. of <SelectorList>), :matches(), :has()

                    default:
                        B++;
                }
                break;

            case 'Type':
            case 'PseudoElement':
                C++;
                break;
        }
    });

    return [A, B, C];
};
