var StyleSheet = function(token) {
    return {
        type: 'StyleSheet',
        info: token[0],
        rules: token.filter(function(item, idx) {
            return idx >= 2 &&
                   item[1] !== 's' &&
                   item[1] !== 'comment' &&
                   item[1] !== 'unknown';
        }).map(convertToInternal)
    };
};

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
    start = skipSC(token, start);
    for (; end >= start; end--) {
        var type = token[end][1];
        if (type !== 's' && type !== 'comment') {
            break;
        }
    }

    if (end < start) {
        return [];
    }

    return token
        .slice(start, end + 1)
        .map(convertToInternal)
        .filter(Boolean);
}

function argumentList(token) {
    var result = [];
    var args = token;
    var start = 2;

    for (var i = start; i < args.length; i++) {
        if (args[i][1] === 'operator' && args[i][2] === ',') {
            result.push({
                type: 'Argument',
                info: {},
                sequence: trimSC(args, start, i - 1)
            });
            start = i + 1;
        }
    }

    var lastArg = trimSC(args, start, args.length - 1);
    if (lastArg.length || result.length) {
        result.push({
            type: 'Argument',
            info: {},
            sequence: lastArg
        });
    }

    return result;
}

var types = {
    atkeyword: false,
    atruleb: function(token) {
        return {
            type: 'Atrule',
            info: token[0],
            name: token[2][2][2],
            expression: {
                type: 'AtruleExpression',
                info: {},
                sequence: trimSC(token, 3, token.length - 2)
            },
            block: convertToInternal(token[token.length - 1])
        };
    },
    atruler: function(token) {
        return {
            type: 'Atrule',
            info: token[0],
            name: token[2][2][2],
            expression: convertToInternal(token[3]),
            block: convertToInternal(token[4])
        };
    },
    atrulerq: function(token) {
        return {
            type: 'AtruleExpression',
            info: token[0],
            sequence: trimSC(token, 2, token.length - 1)
        };
    },
    atrulers: StyleSheet,
    atrules: function(token) {
        return {
            type: 'Atrule',
            info: token[0],
            name: token[2][2][2],
            expression: {
                type: 'AtruleExpression',
                info: {},
                sequence: trimSC(token, 3, token.length - 1)
            },
            block: null
        };
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
        return {
            type: 'Block',
            info: token[0],
            declarations: token.filter(function(item, idx) {
                return idx >= 2 && (item[1] === 'declaration' || item[1] === 'filter');
            }).map(convertToInternal)
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
    declaration: function(token) {
        return {
            type: 'Declaration',
            info: token[0],
            property: convertToInternal(token[2]),
            value: convertToInternal(token[3])
        };
    },
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
    filter: function(token) {
        return {
            type: 'Declaration',
            info: token[0],
            property: convertToInternal(token[2]),
            value: convertToInternal(token[3])
        };
    },
    filterv: function(token) {
        return {
            type: 'Value',
            info: token[0],
            sequence: trimSC(token, 2, token.length - 1)
        };
    },
    functionExpression: function(token) {
        return {
            type: 'Function',
            name: 'expression',
            arguments: [{
                type: 'Argument',
                sequence: [{
                    type: 'Raw',
                    value: token[2]
                }]
            }]
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
    important: function(token) {
        return {
            type: 'Important',
            info: token[0]
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
            arguments: [{
                type: 'Argument',
                sequence: token.filter(function(item, idx) {
                    return idx >= 3 && item[1] !== 's' && item[1] !== 'comment';
                }).map(convertToInternal)
            }]
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
            value: trimSC(token, 2, token.length - 1)[0]
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
                    sequence: [
                        types.simpleselector(value[3][2])
                    ]
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
        var badSelector = false;
        var selectors = token.filter(function(item, idx) {
            var type = item[1];

            if (type === 'simpleselector' || type === 'delim') {
                if (last === type) {
                    badSelector = true;
                }
                last = type;
            }

            return idx >= 2 && type === 'simpleselector';
        }).map(convertToInternal);

        // check selector is valid since gonzales parses selectors
        // like "foo," or "foo,,bar" as correct;
        // w/o this check broken selector will be repaired and broken ruleset apply;
        // return null in this case so compressor could remove ruleset with no selector
        if (badSelector ||
            last === 'delim' ||
            selectors.length === 0 ||
            selectors[selectors.length - 1].sequence.length === 0) {
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
        var sequence = [];
        for (var i = skipSC(token, 2), needCombinator = false; i < token.length; i++) {
            var item = token[i];
            switch (item[1]) {
                case 'combinator':
                    needCombinator = false;
                    sequence.push(item);
                    break;

                case 's':
                    if (sequence[sequence.length - 1][1] !== 'combinator') {
                        needCombinator = item;
                    }
                    break;

                case 'comment':
                    break;

                case 'namespace':
                    // ident namespace ident -> ident '|' ident
                    sequence[sequence.length - 1] = [
                        {},
                        'ident',
                        sequence[sequence.length - 1][2] + '|' + token[i + 1][2]
                    ];
                    i++;
                    break;

                default:
                    if (needCombinator) {
                        sequence.push([needCombinator[0], 'combinator', ' ']);
                    }
                    needCombinator = false;
                    sequence.push(item);
            }
        }

        return {
            type: 'SimpleSelector',
            info: token[0],
            sequence: sequence.map(convertToInternal)
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
            value: trimSC(token, 2, token.length - 1)[0]
        };
    },
    value: function(token) {
        return {
            type: 'Value',
            info: token[0],
            sequence: trimSC(token, 2, token.length - 1)
        };
    },
    vhash: function(token) {
        return {
            type: 'Hash',
            info: token[0],
            value: token[2]
        };
    }
};

function convertToInternal(token, parent, stack) {
    if (token) {
        var type = token[1];

        if (types.hasOwnProperty(type) && typeof types[type] === 'function') {
            return types[type](token);
        }
    }

    return null;
}

module.exports = convertToInternal;
