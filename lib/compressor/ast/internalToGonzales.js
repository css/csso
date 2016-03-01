function eachDelim(node, type, itemsProperty, delimeter) {
    var result = [node.info, type];
    var list = node[itemsProperty];

    list.each(function(data, item) {
        result.push(toGonzales(data));

        if (item.next) {
            result.push(delimeter.slice());
        }
    });

    return result;
}

function buildArguments(body, args) {
    args.each(function(data, item) {
        body.push.apply(body, data.sequence.map(toGonzales));
        if (item.next) {
            body.push([{}, 'operator', ',']);
        }
    });
}

function toGonzales(node) {
    switch (node.type) {
        case 'StyleSheet':
            return [
                node.info || {},
                'stylesheet'
            ].concat(node.rules.map(toGonzales).filter(Boolean));

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

            if (node.expression && !node.expression.sequence.isEmpty()) {
                if (type === 'atruler') {
                    result.push([
                        node.expression.info,
                        'atrulerq',
                        [{}, 's', ' ']
                    ].concat(node.expression.sequence.map(toGonzales)));
                } else {
                    result.push([{}, 's', ' ']);
                    result = result.concat(node.expression.sequence.map(toGonzales));
                }
            } else {
                if (type === 'atruler') {
                    result.push([
                        {},
                        'atrulerq'
                    ]);
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
            var result = [
                node.info,
                'simpleselector'
            ];

            node.sequence.each(function(data) {
                var node = toGonzales(data);

                // add extra spaces around /deep/ combinator since comment beginning/ending may to be produced
                if (data.type === 'Combinator' && data.name === '/deep/') {
                    result.push(
                        [{}, 's', ' '],
                        node,
                        [{}, 's', ' ']
                    );
                } else {
                    result.push(node);
                }
            });

            return result;

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
                'attrib'
            ];

            result.push([{}, 'ident', node.name.name]);

            if (node.operator !== null) {
                result.push([{}, 'attrselector', node.operator]);

                if (node.value !== null) {
                    result.push(toGonzales(node.value));

                    if (node.flags !== null) {
                        if (node.value.type !== 'String') {
                            result.push([{}, 's', ' ']);
                        }

                        result.push([{}, 'attribFlags', node.flags]);
                    }
                }
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

            if (node.name === 'expression') {
                return [{}, 'functionExpression', body[2][2]];
            }

            return [
                node.info,
                'funktion',
                [{}, 'ident', node.name],
                body
            ];

        case 'Block':
            return eachDelim(node, 'block', 'declarations', [{}, 'decldelim']);

        case 'Declaration':
            return [
                node.info,
                !node.value.sequence.isEmpty() &&
                node.value.sequence.first().type === 'Progid' &&
                /(-[a-z]+-|[\*-_])?filter$/.test(node.property.name)
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

        case 'Value':
            var result = [
                node.info,
                !node.sequence.isEmpty() &&
                node.sequence.first().type === 'Progid'
                    ? 'filterv'
                    : 'value'
            ].concat(node.sequence.map(toGonzales));

            if (node.important) {
                result.push([{}, 'important']);
            }

            return result;

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

        case 'Percentage':
            return [node.info, 'percentage', [{}, 'number', node.value]];

        case 'Space':
            return [node.info, 's', ' '];

        case 'Comment':
            return [node.info, 'comment', node.value];

        // nothing to do
        // case 'Argument':

        default:
            throw new Error('Unknown node type: ' + node.type);
    }
}

module.exports = toGonzales;
