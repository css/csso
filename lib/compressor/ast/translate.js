function each(array, buffer) {
    for (var i = 0; i < array.length; i++) {
        translate(array[i], buffer, array, i);
    }
}

function eachDelim(array, buffer, delimeter) {
    for (var i = 0; i < array.length; i++) {
        translate(array[i], buffer, array, i);

        if (i !== array.length - 1) {
            buffer.push(delimeter);
        }
    }
}

function translate(node, buffer, array, i) {
    switch (node.type) {
        case 'Atrule':
            buffer.push('@', node.name);
            if (node.expression && node.expression.sequence.length) {
                buffer.push(' ');
                translate(node.expression, buffer);
            }
            if (node.block) {
                buffer.push('{');
                translate(node.block, buffer);
                buffer.push('}');
            } else {
                buffer.push(';');
            }
            break;

        case 'Declaration':
            translate(node.property, buffer);
            buffer.push(':');
            translate(node.value, buffer);
            break;

        case 'Attribute':
            buffer.push('[');
            translate(node.name, buffer);
            if (node.operator) {
                buffer.push(node.operator);
            }
            if (node.value) {
                translate(node.value, buffer);
            }
            buffer.push(']');
            break;

        case 'FunctionalPseudo':
            buffer.push(':', node.name, '(');
            eachDelim(node.arguments, buffer, ',');
            buffer.push(')');
            break;

        case 'Function':
            buffer.push(node.name, '(');
            eachDelim(node.arguments, buffer, ',');
            buffer.push(')');
            break;

        case 'Block':
            eachDelim(node.declarations, buffer, ';');
            break;

        case 'Ruleset':
            if (node.selector) {
                translate(node.selector, buffer);
            }
            buffer.push('{');
            translate(node.block, buffer);
            buffer.push('}');
            break;

        case 'Selector':
            eachDelim(node.selectors, buffer, ',');
            break;

        case 'Negation':
            buffer.push(':not(');
            eachDelim(node.sequence, buffer, ',');
            buffer.push(')');
            break;

        case 'Braces':
            buffer.push(node.open);
            each(node.sequence, buffer);
            buffer.push(node.close);
            break;

        case 'Argument':
        case 'AtruleExpression':
        case 'Value':
        case 'SimpleSelector':
            each(node.sequence, buffer);
            break;

        case 'StyleSheet':
            each(node.rules, buffer);
            break;

        case 'Url':
            buffer.push('url(');
            translate(node.value, buffer);
            buffer.push(')');
            break;

        case 'Progid':
            translate(node.value, buffer);
            break;

        case 'Property':
        case 'Combinator':
        case 'Identifier':
            buffer.push(node.name);
            break;

        case 'PseudoClass':
            buffer.push(':', node.name);
            break;

        case 'PseudoElement':
            buffer.push('::', node.name);
            break;

        case 'Class':
            buffer.push('.', node.name);
            break;

        case 'Dimension':
            buffer.push(node.value, node.unit);
            break;

        case 'Id':
            buffer.push('#', node.name);
            break;
        case 'Hash':
            buffer.push('#', node.value);
            break;

        case 'Nth':
        case 'Number':
        case 'String':
        case 'Operator':
        case 'Raw':
            buffer.push(node.value);
            break;

        case 'Important': // remove
            buffer.push('!important');
            break;

        case 'Percentage':
            buffer.push(node.value, '%');
            break;

        case 'Space':
            buffer.push(' ');
            break;

        case 'Comment':
            buffer.push('/*', node.value, '*/');
            break;

        default:
            console.warn('Unknown node type:', node);
    }
}

module.exports = function(node) {
    var buffer = [];

    translate(node, buffer);

    return buffer.join('');
};
