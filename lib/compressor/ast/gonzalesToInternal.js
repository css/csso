var List = require('../../utils/list.js');
var styleSheetSeed = 0; // FIXME: until node.js 0.10 support drop and we can't use Map instead

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
        rules: rules,
        id: styleSheetSeed++
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
    return convertToInternal(token[skipSC(token, 2)]);
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
        var name;
        var operator = null;
        var value = null;
        var flags = null;

        offset = skipSC(token, 2);
        name = convertToInternal(token[offset]);

        offset = skipSC(token, offset + 1);
        if (offset < token.length) {
            operator = token[offset][2];

            offset = skipSC(token, offset + 1);
            value = convertToInternal(token[offset]);

            if (offset < token.length) {
                offset = skipSC(token, offset + 1);
                if (offset < token.length && token[offset][1] === 'attribFlags') {
                    flags = token[offset][2];
                }
            }
        }

        return {
            type: 'Attribute',
            info: token[0],
            name: name,
            operator: operator,
            value: value,
            flags: flags
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

            if (name.toLowerCase() === 'not') {
                return {
                    type: 'Negation',
                    sequence: types.selector(value[3]).selectors
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
        var block = convertToInternal(token[3]);

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
                    // bad selector
                    selectors = new List();
                    break;
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
        // make selector empty so compressor can remove ruleset with no selector
        if (last === 'delim' || (!selectors.isEmpty() && selectors.last().sequence.isEmpty())) {
            selectors = new List();
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
        var combinator = null;

        for (var i = skipSC(token, 2); i < token.length; i++) {
            var item = token[i];

            switch (item[1]) {
                case 's':
                    if (!combinator) {
                        combinator = [item[0], 'combinator', ' '];
                    }
                    break;

                case 'comment':
                    break;

                case 'combinator':
                    combinator = item;
                    break;

                default:
                    if (combinator !== null) {
                        sequence.insert(List.createItem(convertToInternal(combinator)));
                    }

                    combinator = null;
                    sequence.insert(List.createItem(convertToInternal(item)));
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
