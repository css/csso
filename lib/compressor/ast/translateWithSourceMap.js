var SourceNode = require('source-map').SourceNode;

function each(list) {
    if (list.head && list.head === list.tail) {
        return translate(list.head.data);
    }

    return list.map(translate).join('');
}

function eachDelim(list, delimeter) {
    if (list.head && list.head === list.tail) {
        return translate(list.head.data);
    }

    return list.map(translate).join(delimeter);
}

function createAnonymousSourceNode(children) {
    return new SourceNode(
        null,
        null,
        null,
        children
    );
}

function createSourceNode(node, children) {
    return new SourceNode(
        node.info.line,
        node.info.column - 1,
        node.info.source,
        children
    );
}

function translate(node) {
    switch (node.type) {
        case 'StyleSheet':
            return createAnonymousSourceNode(node.rules.map(translate));

        case 'Atrule':
            var nodes = ['@', node.name];

            if (node.expression && !node.expression.sequence.isEmpty()) {
                nodes.push(' ', translate(node.expression));
            }

            if (node.block) {
                nodes.push('{', translate(node.block), '}');
            } else {
                nodes.push(';');
            }

            return createSourceNode(node, nodes);

        case 'Ruleset':
            return node.selector
                ? createAnonymousSourceNode([translate(node.selector), '{', translate(node.block), '}'])
                : createAnonymousSourceNode(['{', translate(node.block), '}']);

        case 'Selector':
            var nodes = [];

            node.selectors.each(function(item) {
                nodes.push(nodes.length > 0 ? ',' : '', translate(item));
            });

            return createAnonymousSourceNode(nodes);

        case 'SimpleSelector':
            return createSourceNode(node, node.sequence.map(translate));

        case 'Block':
            var nodes = [];

            node.declarations.each(function(item) {
                nodes.push(nodes.length > 0 ? ';' : '', translate(item));
            });

            return createAnonymousSourceNode(nodes);

        case 'Declaration':
            return createSourceNode(
                node,
                [translate(node.property), ':', translate(node.value)]
            );

        case 'Value':
            return node.important
                ? each(node.sequence) + '!important'
                : each(node.sequence);

        case 'Attribute':
            return '[' +
                translate(node.name) +
                (node.operator !== null ? node.operator : '') +
                (node.value ? translate(node.value) : '') +
            ']';

        case 'FunctionalPseudo':
            return ':' + node.name + '(' + eachDelim(node.arguments, ',') + ')';

        case 'Function':
            return node.name + '(' + eachDelim(node.arguments, ',') + ')';

        case 'Negation':
            return ':not(' + eachDelim(node.sequence, ',') + ')';

        case 'Braces':
            return node.open + each(node.sequence) + node.close;

        case 'Argument':
        case 'AtruleExpression':
            return each(node.sequence);

        case 'Url':
            return 'url(' + translate(node.value) + ')';

        case 'Progid':
            return translate(node.value);

        case 'Property':
            return node.name;

        case 'Combinator':
            return node.name;

        case 'Identifier':
            return node.name;

        case 'PseudoClass':
            return ':' + node.name;

        case 'PseudoElement':
            return '::' + node.name;

        case 'Class':
            return '.' + node.name;

        case 'Id':
            return '#' + node.name;

        case 'Hash':
            return '#' + node.value;

        case 'Dimension':
            return node.value + node.unit;

        case 'Nth':
            return node.value;

        case 'Number':
            return node.value;

        case 'String':
            return node.value;

        case 'Operator':
            return node.value;

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

module.exports = function(node, filename, source) {
    var result = new SourceNode(1, 1, filename, translate(node)).toStringWithSourceMap();

    result.map.setSourceContent(filename, source);

    return {
        css: result.code,
        map: result.map
    };
};

