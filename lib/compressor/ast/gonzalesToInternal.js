var List = require('../../utils/list.js');

function StyleSheet(tokens) {
    var rules = new List();

    for (var i = 2; i < tokens.length; i++) {
        var token = tokens[i];
        var type = token[1];

        if (type !== 's' &&
            type !== 'comment' &&
            type !== 'unknown') {
            rules.insert(List.createItem(convertToInternal(token)));
        }
    }

    return {
        type: 'StyleSheet',
        info: tokens[0],
        avoidRulesMerge: false,
        rules: rules
    };
}

function Atrule(token, expression, block) {
    if (expression instanceof List) {
        expression = {
            type: 'AtruleExpression',
            info: expression.head ? expression.head.data.info : null,
            sequence: expression,
            id: null
        };
    }

    return {
        type: 'Atrule',
        info: token[0],
        name: token[2][2][2],
        expression: expression,
        block: block
    };
}

function Declaration(token) {
    return {
        type: 'Declaration',
        info: token[0],
        property: convertToInternal(token[2]),
        value: convertToInternal(token[3]),
        id: 0,
        length: 0,
        fingerprint: null
    };
}

function Value(token) {
    var important = false;
    var end = token.length - 1;

    for (; end >= 2; end--) {
        var type = token[end][1];
        if (type !== 's' && type !== 'comment') {
            if (type === 'important' && !important) {
                important = true;
            } else {
                break;
            }
        }
    }

    return {
        type: 'Value',
        info: token[0],
        important: important,
        sequence: trimSC(token, 2, end)
    };
}

function firstNonSC(token) {
    var offset = skipSC(token, 2);

    if (offset < token.length) {
        return convertToInternal(token[offset]);
    }

    return null;
}

function skipSC(token, offset) {
    for (; offset < token.length; offset++) {
        var type = token[offset][1];
        if (type !== 's' && type !== 'comment') {
            break;
        }
    }

    return offset;
}

function trimSC(token, start, end) {
    var list = new List();

    start = skipSC(token, start);
    for (; end >= start; end--) {
        var type = token[end][1];
        if (type !== 's' && type !== 'comment') {
            break;
        }
    }

    for (var i = start; i <= end; i++) {
        var node = convertToInternal(token[i]);
        if (node) {
            list.insert(List.createItem(node));
        }
    }

    return list;
}

function argumentList(token) {
    var list = new List();
    var args = token;
    var start = 2;

    for (var i = start; i < args.length; i++) {
        if (args[i][1] === 'operator' && args[i][2] === ',') {
            list.insert(List.createItem({
                type: 'Argument',
                info: {},
                sequence: trimSC(args, start, i - 1)
            }));
            start = i + 1;
        }
    }

    var lastArg = trimSC(args, start, args.length - 1);
    if (lastArg.head || list.head) {
        list.insert(List.createItem({
            type: 'Argument',
            info: {},
            sequence: lastArg
        }));
    }

    return list;
}

var types = {
    atkeyword: false,
    atruleb: function(token) {
        return Atrule(
            token,
            trimSC(token, 3, token.length - 2),
            convertToInternal(token[token.length - 1])
        );
    },
    atruler: function(token) {
        return Atrule(
            token,
            convertToInternal(token[3]),
            convertToInternal(token[4])
        );
    },
    atrulerq: function(token) {
        return {
            type: 'AtruleExpression',
            info: token[0],
            sequence: trimSC(token, 2, token.length - 1),
            id: null
        };
    },
    atrulers: StyleSheet,
    atrules: function(token) {
        return Atrule(
            token,
            trimSC(token, 3, token.length - 1),
            null
        );
    },
    attrib: function(token) {
        var offset = 2;

        offset = skipSC(token, 2);
        var name = convertToInternal(token[offset]);

        if (token[offset + 1] && token[offset + 1][1] === 'namespace') {
            name.name += '|' + token[offset + 2][2];
            offset += 2;
        }

        offset = skipSC(token, offset + 1);
        var operator = token[offset] ? token[offset][2] : null;

        offset = skipSC(token, offset + 1);
        var value = convertToInternal(token[offset]);

        return {
            type: 'Attribute',
            info: token[0],
            name: name,
            operator: operator,
            value: value
        };
    },
    attrselector: false,
    block: function(token) {
        var declarations = new List();

        for (var i = 2; i < token.length; i++) {
            var item = token[i];
            var type = item[1];

            if (type === 'declaration' || type === 'filter') {
                declarations.insert(List.createItem(convertToInternal(item)));
            }
        }

        return {
            type: 'Block',
            info: token[0],
            declarations: declarations
        };
    },
    braces: function(token) {
        return {
            type: 'Braces',
            info: token[0],
            open: token[2],
            close: token[3],
            sequence: trimSC(token, 4, token.length - 1)
        };
    },
    clazz: function(token) {
        return {
            type: 'Class',
            info: token[0],
            name: token[2][2]
        };
    },
    combinator: function(token) {
        return {
            type: 'Combinator',
            info: token[0],
            name: token[2]
        };
    },
    comment: false,
    declaration: Declaration,
    decldelim: false, // redundant
    delim: false,     // redundant
    dimension: function(token) {
        return {
            type: 'Dimension',
            info: token[0],
            value: token[2][2],
            unit: token[3][2]
        };
    },
    filter: Declaration,
    filterv: Value,
    functionExpression: function(token) {
        return {
            type: 'Function',
            name: 'expression',
            arguments: new List([{
                type: 'Argument',
                sequence: new List([{
                    type: 'Raw',
                    value: token[2]
                }])
            }])
        };
    },
    funktion: function(token) {
        return {
            type: 'Function',
            info: token[0],
            name: token[2][2],
            arguments: argumentList(token[3])
        };
    },
    functionBody: false,  // redundant
    ident: function(token) {
        return {
            type: 'Identifier',
            info: token[0],
            name: token[2]
        };
    },
    namespace: false,
    nth: function(token) {
        return {
            type: 'Nth',
            value: token[2]
        };
    },
    nthselector: function(token) {
        return {
            type: 'FunctionalPseudo',
            info: token[0],
            name: token[2][2],
            arguments: new List([{
                type: 'Argument',
                sequence: new List(
                    token
                        .slice(3)
                        .filter(function(item) {
                            return item[1] !== 's' && item[1] !== 'comment';
                        })
                        .map(convertToInternal)
                )
            }])
        };
    },
    number: function(token) {
        return {
            type: 'Number',
            info: token[0],
            value: token[2]
        };
    },
    operator: function(token) {
        return {
            type: 'Operator',
            info: token[0],
            value: token[2]
        };
    },
    percentage: function(token) {
        return {
            type: 'Percentage',
            info: token[0],
            value: token[2][2]
        };
    },
    progid: function(token) {
        return {
            type: 'Progid',
            info: token[0],
            value: firstNonSC(token)
        };
    },
    property: function(token) {
        return {
            type: 'Property',
            info: token[0],
            name: token[2][2]
        };
    },
    pseudoc: function(token) {
        var value = token[2];

        if (value[1] === 'funktion') {
            var name = value[2][2];

            if (name === 'not') {
                return {
                    type: 'Negation',
                    sequence: new List([
                        types.simpleselector(value[3][2])
                    ])
                };
            }

            return {
                type: 'FunctionalPseudo',
                info: value[0],
                name: name,
                arguments: argumentList(value[3])
            };
        }

        return {
            type: 'PseudoClass',
            info: token[0],
            name: value[2]
        };
    },
    pseudoe: function(token) {
        var value = token[2];

        return {
            type: 'PseudoElement',
            info: token[0],
            name: value[2]
        };
    },
    raw: function(token) {
        return {
            type: 'Raw',
            info: token[0],
            value: token[2]
        };
    },
    ruleset: function(token) {
        var selector = convertToInternal(token[2]);
        var block;

        if (token.length === 4) {
            block = convertToInternal(token[3]);
        } else {
            block = selector;
            selector = null;
        }

        return {
            type: 'Ruleset',
            info: token[0],
            pseudoSignature: null,
            selector: selector,
            block: block
        };
    },
    s: function(token) {
        return {
            type: 'Space',
            info: token[0]
        };
    },
    selector: function(token) {
        var last = 'delim';
        var selectors = new List();

        for (var i = 2; i < token.length; i++) {
            var item = token[i];
            var type = item[1];

            if (type === 'simpleselector' || type === 'delim') {
                if (last === type) {
                    return null; // bad selector
                }
                last = type;
            }

            if (type === 'simpleselector') {
                selectors.insert(List.createItem(convertToInternal(item)));
            }
        }

        // check selector is valid since gonzales parses selectors
        // like "foo," or "foo,,bar" as correct;
        // w/o this check broken selector will be repaired and broken ruleset apply;
        // return null in this case so compressor could remove ruleset with no selector
        if (last === 'delim' ||
            selectors.isEmpty() ||
            selectors.last().sequence.isEmpty()) {
            return null;
        }

        return {
            type: 'Selector',
            info: token[0],
            selectors: selectors
        };
    },
    shash: function(token) {
        return {
            type: 'Id',
            info: token[0],
            name: token[2]
        };
    },
    simpleselector: function(token) {
        var sequence = new List();
        var needCombinator = false;
        var lastNode;

        for (var i = skipSC(token, 2); i < token.length; i++) {
            var item = token[i];

            switch (item[1]) {
                case 's':
                    if (lastNode.type !== 'Combinator') {
                        needCombinator = item;
                    }
                    break;

                case 'comment':
                    break;

                case 'namespace':
                    // ident namespace ident -> ident '|' ident
                    lastNode.name += '|' + token[i + 1][2];
                    i++;
                    break;

                case 'combinator':
                    needCombinator = false;
                    lastNode = convertToInternal(item);
                    sequence.insert(List.createItem(lastNode));
                    break;

                default:
                    if (needCombinator) {
                        sequence.insert(List.createItem({
                            type: 'Combinator',
                            info: needCombinator[0],
                            name: ' '
                        }));
                    }

                    needCombinator = false;
                    lastNode = convertToInternal(item);
                    sequence.insert(List.createItem(lastNode));
            }
        }

        return {
            type: 'SimpleSelector',
            info: token[0],
            sequence: sequence,
            id: null,
            compareMarker: null
        };
    },
    string: function(token) {
        return {
            type: 'String',
            info: token[0],
            value: token[2]
        };
    },
    stylesheet: StyleSheet,
    unary: function(token) {
        return {
            type: 'Operator',
            info: token[0],
            value: token[2]
        };
    },
    unknown: false,
    uri: function(token) {
        return {
            type: 'Url',
            info: token[0],
            value: firstNonSC(token)
        };
    },
    value: Value,
    vhash: function(token) {
        return {
            type: 'Hash',
            info: token[0],
            value: token[2]
        };
    }
};

function convertToInternal(token) {
    if (token) {
        var type = token[1];

        if (types.hasOwnProperty(type) && typeof types[type] === 'function') {
            return types[type](token);
        }
    }

    return null;
}

module.exports = convertToInternal;
