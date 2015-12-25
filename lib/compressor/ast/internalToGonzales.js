function each(array, buffer) {
    for (var i = 0; i < array.length; i++) {
        toGonzales(array[i], buffer, array, i);
    }
}

function eachDelim(node, type, itemsProperty, delimeter) {
    var result = [node.info, type];
    var items = node[itemsProperty];

    for (var i = 0; i < items.length; i++) {
        result.push(toGonzales(items[i]));

        if (i !== items.length - 1) {
            result.push(delimeter.slice());
        }
    }

    return result;
}

function buildArguments(body, args) {
    for (var i = 0; i < args.length; i++) {
        body.push.apply(body, args[i].sequence.map(toGonzales));
        if (i !== args.length - 1) {
            body.push([{}, 'operator', ',']);
        }
    }
}

function toGonzales(node) {
    switch (node.type) {
        case 'StyleSheet':
            return [
                node.info || {},
                'stylesheet'
            ].concat(node.rules.map(toGonzales).filter(Boolean));
            break;

        case 'Atrule':
            var type = 'atruler';

            if (!node.block) {
                type = 'atrules';
            } else {
                if (node.block.type === 'Block') {
                    type = 'atruleb';
                }
            }

            var result = [
                node.info,
                type,
                [{}, 'atkeyword', [{}, 'ident', node.name]]
            ];

            if (node.expression && node.expression.sequence.length) {
                if (type === 'atruler') {
                    result.push([
                        node.info,
                        'atrulerq',
                        [{}, 's', ' ']
                    ].concat(node.expression.sequence.map(toGonzales)));
                } else {
                    result.push([{}, 's', ' ']);
                    result = result.concat(node.expression.sequence.map(toGonzales));
                }
            }

            if (node.block) {
                if (type === 'atruler') {
                    result.push([
                        node.block.info,
                        'atrulers'
                    ].concat(node.block.rules.map(toGonzales)));
                } else {
                    result.push(toGonzales(node.block));
                }
            }

            return result;

        case 'Ruleset':
            return [
                node.info,
                'ruleset',
                toGonzales(node.selector),
                toGonzales(node.block)
            ];

        case 'Selector':
            return eachDelim(node, 'selector', 'selectors', [{}, 'delim']);

        case 'SimpleSelector':
            return [
                node.info,
                'simpleselector'
            ].concat(node.sequence.map(toGonzales));

        case 'Negation':
            var body = eachDelim(node, 'functionBody', 'sequence', [{}, 'delim']);

            return [
                node.info,
                'pseudoc',
                [
                    {},
                    'funktion',
                    [{}, 'ident', 'not'],
                    body
                ]
            ];

        case 'Attribute':
            var result = [
                node.info,
                'attrib',
                toGonzales(node.name)
            ];
            if (node.operator) {
                result.push([{}, 'attrselector', node.operator]);
            }
            if (node.value) {
                result.push(toGonzales(node.value));
            }
            return result;

        case 'FunctionalPseudo':
            if (/^nth-/.test(node.name)) {
                var result = [
                    node.info,
                    'nthselector',
                    [{}, 'ident', node.name]
                ];

                buildArguments(result, node.arguments);

                return result;
            } else {
                var body = [
                    {},
                    'functionBody'
                ];

                buildArguments(body, node.arguments);

                return [
                    node.info,
                    'pseudoc',
                    [
                        {},
                        'funktion',
                        [{}, 'ident', node.name],
                        body
                    ]
                ];
            }

        case 'Function':
            var body = [
                {},
                'functionBody'
            ];

            buildArguments(body, node.arguments);

            return [
                node.info,
                'funktion',
                [{}, 'ident', node.name],
                body
            ];

        case 'Argument':
            return;

        case 'Block':
            return eachDelim(node, 'block', 'declarations', [{}, 'decldelim']);

        case 'Declaration':
            return [
                node.info,
                node.property.name === 'filter' &&
                node.value.sequence.length &&
                node.value.sequence[0].type === 'Progid'
                    ? 'filter'
                    : 'declaration',
                toGonzales(node.property),
                toGonzales(node.value)
            ];

        case 'Braces':
            return [
                node.info,
                'braces',
                node.open,
                node.close
            ].concat(node.sequence.map(toGonzales));

        // case 'AtruleExpression':

        case 'Value':
            return [
                node.info,
                node.sequence.length &&
                node.sequence[0].type === 'Progid'
                    ? 'filterv'
                    : 'value'
            ].concat(node.sequence.map(toGonzales));

        case 'Url':
            return [node.info, 'uri', toGonzales(node.value)];

        case 'Progid':
            return [node.info, 'progid', toGonzales(node.value)];

        case 'Property':
            return [node.info, 'property', [{}, 'ident', node.name]];

        case 'Combinator':
            return node.name === ' '
                ? [node.info, 's', node.name]
                : [node.info, 'combinator', node.name];

        case 'Identifier':
            return [node.info, 'ident', node.name];

        case 'PseudoElement':
            return [node.info, 'pseudoe', [{}, 'ident', node.name]];

        case 'PseudoClass':
            return [node.info, 'pseudoc', [{}, 'ident', node.name]];

        case 'Class':
            return [node.info, 'clazz', [{}, 'ident', node.name]];

        case 'Id':
            return [node.info, 'shash', node.name];

        case 'Nth':
            return [node.info, 'nth', node.value];

        case 'Hash':
            return [node.info, 'vhash', node.value];

        case 'Number':
            return [node.info, 'number', node.value];

        case 'Dimension':
            return [
                node.info,
                'dimension',
                [{}, 'number', node.value],
                [{}, 'ident', node.unit]
            ];

        case 'Operator':
            return [
                node.info,
                node.value === '+' || node.value === '-' ? 'unary' : 'operator',
                node.value
            ];

        case 'Raw':
            return [node.info, node.value && /\S/.test(node.value) ? 'raw' : 's', node.value];

        case 'String':
            return [node.info, 'string', node.value];

        case 'Important':
            return [node.info, 'important'];

        case 'Percentage':
            return [node.info, 'percentage', [{}, 'number', node.value]];

        case 'Space':
            return [node.info, 's', ' '];

        case 'Comment':
            return [node.info, 'comment', node.value];

        default:
            console.warn('Unknown node type:', node);
    }
}

module.exports = function(node) {
    return toGonzales(node);
};
