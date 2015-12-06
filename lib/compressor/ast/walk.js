function walkRuleset(node, fn) {
    switch (node.type) {
        case 'Atrule':
            if (node.block) {
                walkRuleset(node.block, fn);
            }
            fn(node);
            break;

        case 'StyleSheet':
            for (var i = 0; i < node.rules.length; i++) {
                walkRuleset(node.rules[i], fn);
            }
            break;

        case 'Ruleset':
            fn(node);
            break;
    }
}

function walkAllEach(array, fn) {
    for (var i = 0; i < array.length; i++) {
        walkAll(array[i], fn);
    }
}

function walkAll(node, fn) {
    switch (node.type) {
        case 'Atrule':
            if (node.expression) {
                walkAll(node.expression, fn);
            }
            if (node.block) {
                walkAll(node.block, fn);
            }
            break;

        case 'Declaration':
            walkAll(node.property, fn);
            walkAll(node.value, fn);
            break;

        case 'Attribute':
            walkAll(node.name, fn);
            if (node.value) {
                walkAll(node.value, fn);
            }
            break;

        case 'FunctionalPseudo':
        case 'Function':
            walkAllEach(node.arguments, fn);
            break;

        case 'Block':
            walkAllEach(node.declarations, fn);
            break;

        case 'Ruleset':
            walkAll(node.selector, fn);
            walkAll(node.block, fn);
            break;

        case 'Selector':
            walkAllEach(node.selectors, fn);
            break;

        case 'Argument':
        case 'AtruleExpression':
        case 'Braces':
        case 'Negation':
        case 'Value':
        case 'SimpleSelector':
            walkAllEach(node.sequence, fn);
            break;

        case 'StyleSheet':
            walkAllEach(node.rules, fn);
            break;

        case 'Url':
        case 'Progid':
            walkAll(node.value, fn);
            break;

        case 'Property':
        case 'Combinator':
        case 'Dimension':
        case 'Hash':
        case 'Identifier':
        case 'Important': // remove
        case 'Nth':
        case 'Class':
        case 'Id':
        case 'Percentage':
        case 'PseudoClass':
        case 'PseudoElement':
        case 'Space':
        case 'Number':
        case 'String':
        case 'Operator':
        case 'Raw':
            break;
    }

    fn(node);
}

module.exports = {
    all: walkAll,
    ruleset: walkRuleset
};
