function each(list) {
    return list.map(translate).join('');
}

function eachDelim(list, delimeter) {
    return list.map(translate).join(delimeter);
}

function translate(node) {
    switch (node.type) {
        case 'Atrule':
            var result = '@' + node.name;

            if (node.expression && !node.expression.sequence.isEmpty()) {
                result += ' ' + translate(node.expression);
            }

            if (node.block) {
                return result + '{' + translate(node.block) + '}';
            } else {
                return result + ';';
            }

        case 'Declaration':
            return translate(node.property) + ':' + translate(node.value);

        case 'Attribute':
            return '[' +
                translate(node.name) +
                (node.operator || '') +
                (node.value ? translate(node.value) : '') +
            ']';

        case 'FunctionalPseudo':
            return ':' + node.name + '(' + eachDelim(node.arguments, ',') + ')';

        case 'Function':
            return node.name + '(' + eachDelim(node.arguments, ',') + ')';

        case 'Block':
            return eachDelim(node.declarations, ';');

        case 'Ruleset':
            return node.selector
                ? translate(node.selector) + '{' + translate(node.block) + '}'
                : '{' + translate(node.block) + '}';

        case 'Selector':
            return eachDelim(node.selectors, ',');

        case 'Negation':
            return ':not(' + eachDelim(node.sequence, ',') + ')';

        case 'Braces':
            return node.open + each(node.sequence) + node.close;

        case 'Value':
            return node.important
                ? each(node.sequence) + '!important'
                : each(node.sequence);

        case 'Argument':
        case 'AtruleExpression':
        case 'SimpleSelector':
            return each(node.sequence);

        case 'StyleSheet':
            return each(node.rules);

        case 'Url':
            return 'url(' + translate(node.value) + ')';

        case 'Progid':
            return translate(node.value);

        case 'Property':
        case 'Combinator':
        case 'Identifier':
            return node.name;

        case 'PseudoClass':
            return ':' + node.name;

        case 'PseudoElement':
            return '::' + node.name;

        case 'Class':
            return '.' + node.name;

        case 'Dimension':
            return node.value + node.unit;

        case 'Id':
            return '#' + node.name;

        case 'Hash':
            return '#' + node.value;

        case 'Nth':
        case 'Number':
        case 'String':
        case 'Operator':
        case 'Raw':
            return node.value;

        case 'Percentage':
            return node.value + '%';

        case 'Space':
            return ' ';

        case 'Comment':
            return '/*' + node.value + '*/';

        default:
            console.warn('Unknown node type:', node);
    }
}

module.exports = translate;
