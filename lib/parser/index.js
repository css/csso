'use strict';

var TokenType = require('./const.js').TokenType;
var NodeType = require('./const.js').NodeType;
var tokenize = require('./tokenize.js');
var cleanInfo = require('../utils/cleanInfo.js');
var needPositions;
var filename;
var tokens;
var pos;

var CSSPRules = {
    'atkeyword': getAtkeyword,
    'atruleb': getAtrule,
    'atruler': getAtrule,
    'atrules': getAtrule,
    'attrib': getAttrib,
    'attrselector': getAttrselector,
    'block': getBlock,
    'braces': getBraces,
    'clazz': getClass,
    'combinator': getCombinator,
    'comment': getComment,
    'declaration': getDeclaration,
    'dimension': getDimension,
    'filter': getDeclaration,
    'functionExpression': getFunctionExpression,
    'funktion': getFunction,
    'ident': getIdentifier,
    'important': getImportant,
    'nth': getNth,
    'nthselector': getNthSelector,
    'number': getNumber,
    'operator': getOperator,
    'percentage': getPercentage,
    'progid': getProgid,
    'property': getProperty,
    'pseudoc': getPseudoc,
    'pseudoe': getPseudoe,
    'ruleset': getRuleset,
    'selector': getSelector,
    'shash': getShash,
    'simpleselector': getSimpleSelector,
    'string': getString,
    'stylesheet': getStylesheet,
    'unary': getUnary,
    'unknown': getUnknown,
    'uri': getUri,
    'value': getValue,
    'vhash': getVhash
};

function parseError(message) {
    var error = new Error(message);
    var line = 1;
    var column = 1;
    var lines;

    if (tokens.length) {
        if (pos < tokens.length) {
            line = tokens[pos].line;
            column = tokens[pos].column;
        } else {
            pos = tokens.length - 1;
            lines = tokens[pos].value.split(/\n|\r\n?|\f/);
            line = tokens[pos].line + lines.length - 1;
            column = lines.length > 1
                ? lines[lines.length - 1].length + 1
                : tokens[pos].column + lines[lines.length - 1].length;
        }

    }

    error.parseError = {
        line: line,
        column: column
    };

    throw error;
}

function expect(pos, tokenType) {
    if (pos < tokens.length && tokens[pos].type === tokenType) {
        return;
    }

    parseError(tokenType + ' is expected');
}

function expectAny(pos) {
    if (pos < tokens.length) {
        for (var i = 1, type = tokens[pos].type; i < arguments.length; i++) {
            if (type === arguments[i]) {
                return;
            }
        }
    }

    parseError(Array.prototype.slice.call(arguments, 1).join(' or ') + ' is expected');
}

function getInfo(idx) {
    if (!needPositions) {
        return {};
    }

    var token = tokens[idx];

    return {
        offset: token.offset,
        line: token.line,
        column: token.column
    };
}

function createToken(type) {
    return [getInfo(pos), type];
}

function getStylesheet(nested) {
    var stylesheet = createToken(NodeType.StylesheetType);

    scan:
    while (pos < tokens.length) {
        switch (tokens[pos].type) {
            case TokenType.Space:
                stylesheet.push(getS());
                break;

            case TokenType.Comment:
                stylesheet.push(getComment());
                break;

            case TokenType.Unknown:
                stylesheet.push(getUnknown());
                break;

            case TokenType.CommercialAt:
                stylesheet.push(getAtrule());
                break;

            case TokenType.RightCurlyBracket:
                if (!nested) {
                    parseError('Unexpected right curly brace');
                }

                break scan;

            default:
                stylesheet.push(getRuleset());
        }
    }

    return stylesheet;
}

function isBlockAtrule(i) {
    for (i++; i < tokens.length; i++) {
        var type = tokens[i].type;

        if (type === TokenType.RightCurlyBracket) {
            return true;
        }

        if (type === TokenType.LeftCurlyBracket ||
            type === TokenType.CommercialAt) {
            return false;
        }
    }

    return true;
}

function getAtkeyword() {
    expect(pos, TokenType.CommercialAt);
    pos++;

    return [getInfo(pos - 1), NodeType.AtkeywordType, getIdentifier()];
}

function getAtrule() {
    var node = [getInfo(pos), NodeType.AtrulesType, getAtkeyword(pos)];

    scan:
    while (pos < tokens.length) {
        switch (tokens[pos].type) {
            case TokenType.Semicolon:
                pos++;
                break scan;

            case TokenType.LeftCurlyBracket:
                if (isBlockAtrule(pos)) {
                    node[1] = NodeType.AtrulebType;
                    node.push(getBlock());
                } else {
                    node[1] = NodeType.AtrulerType;
                    node.push([
                        {},
                        NodeType.AtrulerqType
                    ].concat(node.splice(3)));

                    pos++;  // {

                    var stylesheet = getStylesheet(true);
                    stylesheet[1] = NodeType.AtrulersType;
                    node.push(stylesheet);

                    pos++;  // }
                }
                break scan;

            case TokenType.Space:
                node.push(getS());
                break;

            case TokenType.Comment:
                node.push(getComment());
                break;

            case TokenType.Comma:
                node.push(getOperator());
                break;

            case TokenType.NumberSign:
                node.push(getVhash());
                break;

            case TokenType.LeftParenthesis:
            case TokenType.LeftSquareBracket:
                node.push(getBraces());
                break;

            default:
                node.push(getAny());
        }
    }

    return node;
}

function getRuleset() {
    return [
        getInfo(pos),
        NodeType.RulesetType,
        getSelector(),
        getBlock()
    ];
}

function getSelector() {
    var selector = createToken(NodeType.SelectorType);

    scan:
    while (pos < tokens.length) {
        switch (tokens[pos].type) {
            case TokenType.LeftCurlyBracket:
                break scan;

            case TokenType.Comma:
                selector.push(getDelim());
                break;

            default:
                selector.push(getSimpleSelector());
        }
    }

    return selector;
}

function getSimpleSelector(nested) {
    var node = createToken(NodeType.SimpleselectorType);

    scan:
    while (pos < tokens.length) {
        switch (tokens[pos].type) {
            case TokenType.Comma:
            case TokenType.LeftCurlyBracket:
                break scan;

            case TokenType.RightParenthesis:
                if (!nested) {
                    parseError('Unexpected input');
                }

                break scan;

            case TokenType.Space:
                node.push(getS());
                break;

            case TokenType.Comment:
                node.push(getComment());
                break;

            case TokenType.PlusSign:
            case TokenType.GreaterThanSign:
            case TokenType.Tilde:
            case TokenType.Solidus:
                node.push(getCombinator());
                break;

            case TokenType.FullStop:
                node.push(getClass());
                break;

            case TokenType.LeftSquareBracket:
                node.push(getAttrib());
                break;

            case TokenType.NumberSign:
                node.push(getShash());
                break;

            case TokenType.Colon:
                node.push(getPseudo());
                break;

            default:
                node.push(
                    tryGetPercentage() ||
                    getNamespacedIdentifier(false)
                );
        }
    }

    return node;
}

function getBlock() {
    var node = createToken(NodeType.BlockType);

    expect(pos, TokenType.LeftCurlyBracket);
    pos++;

    scan:
    while (pos < tokens.length) {
        switch (tokens[pos].type) {
            case TokenType.RightCurlyBracket:
                break scan;

            case TokenType.Space:
                node.push(getS());
                break;

            case TokenType.Comment:
                node.push(getComment());
                break;

            case TokenType.Semicolon:
                node.push(getDecldelim());
                break;

            default:
                node.push(getDeclaration());
        }
    }

    expect(pos, TokenType.RightCurlyBracket);
    pos++;

    return node;
}

function getDeclaration() {
    var startPos = pos;
    var info = getInfo(pos);
    var property = getProperty();

    expect(pos, TokenType.Colon);
    pos++;

    // check it's a filter
    for (var j = startPos; j < pos; j++) {
        if (tokens[j].value === 'filter') {
            if (checkProgid(pos)) {
                return [
                    info,
                    NodeType.FilterType,
                    property,
                    getFilterv()
                ];
            }
            break;
        }
    }

    return [
        info,
        NodeType.DeclarationType,
        property,
        getValue()
    ];
}

function getProperty() {
    var info = getInfo(pos);
    var name = '';

    while (pos < tokens.length) {
        var type = tokens[pos].type;

        if (type !== TokenType.Solidus &&
            type !== TokenType.Asterisk &&
            type !== TokenType.DollarSign) {
            break;
        }

        name += tokens[pos++].value;
    }

    return readSC([
        info,
        NodeType.PropertyType,
        [
            info,
            NodeType.IdentType,
            name + readIdent()
        ]
    ]);
}

function getValue() {
    var node = createToken(NodeType.ValueType);

    scan:
    while (pos < tokens.length) {
        switch (tokens[pos].type) {
            case TokenType.RightCurlyBracket:
            case TokenType.Semicolon:
                break scan;

            case TokenType.Space:
                node.push(getS());
                break;

            case TokenType.Comment:
                node.push(getComment());
                break;

            case TokenType.NumberSign:
                node.push(getVhash());
                break;

            case TokenType.Solidus:
            case TokenType.Comma:
                node.push(getOperator());
                break;

            case TokenType.LeftParenthesis:
            case TokenType.LeftSquareBracket:
                node.push(getBraces());
                break;

            case TokenType.ExclamationMark:
                node.push(getImportant());
                break;

            default:
                // check for unicode range: U+0F00, U+0F00-0FFF, u+0F00??
                if (tokens[pos].type === TokenType.Identifier) {
                    var prefix = tokens[pos].value;
                    if ((prefix === 'U' || prefix === 'u') &&
                        pos + 1 < tokens.length &&
                        tokens[pos + 1].type === TokenType.PlusSign) {
                        pos += 2;

                        node.push([
                            getInfo(pos),
                            NodeType.IdentType,
                            prefix + '+' + getUnicodeRange(true)
                        ]);
                        break;
                    }
                }

                node.push(getAny());
        }
    }

    return node;
}

// any = string | percentage | dimension | number | uri | functionExpression | funktion | unary | operator | ident
function getAny() {
    var startPos = pos;

    switch (tokens[pos].type) {
        case TokenType.String:
            return getString();

        case TokenType.FullStop:
        case TokenType.DecimalNumber:
        case TokenType.HyphenMinus:
        case TokenType.PlusSign:
            var number = tryGetNumber();

            if (number !== null) {
                if (pos < tokens.length) {
                    if (tokens[pos].type === TokenType.PercentSign) {
                        return getPercentage(startPos, number);
                    } else if (tokens[pos].type === TokenType.Identifier) {
                        return getDimension(startPos, number);
                    }
                }

                return number;
            } else {
                if (tokens[pos].type === TokenType.HyphenMinus ||
                    tokens[pos].type === TokenType.PlusSign) {
                    return getUnary();
                }
            }

            parseError('Unexpected input');
            break;

        default:
            var ident = getIdentifier();

            if (pos < tokens.length && tokens[pos].type === TokenType.LeftParenthesis) {
                switch (ident[2]) {
                    case 'url':
                        return getUri(startPos, ident);

                    case 'expression':
                        return getFunctionExpression(startPos, ident);

                    default:
                        return getFunction(startPos, ident);
                }
            }

            return ident;
    }
}

function getAttrib() {
    var node = [getInfo(pos), NodeType.AttribType];

    expect(pos, TokenType.LeftSquareBracket);
    pos++;

    readSC(node);

    node.push(getNamespacedIdentifier(true));

    readSC(node);

    if (checkAttrselector(pos)) {
        node.push(getAttrselector());
        readSC(node);

        if (pos < tokens.length && tokens[pos].type === TokenType.String) {
            node.push(getString());
        } else {
            node.push(getIdentifier());
        }

        readSC(node);
    }

    expect(pos, TokenType.RightSquareBracket);
    pos++;

    return node;
}

function checkAttrselector(_i) {
    switch (_i < tokens.length && tokens[_i].type) {
        case TokenType.EqualsSign:
            return 1;

        case TokenType.Tilde:             // ~=
        case TokenType.CircumflexAccent:  // ^=
        case TokenType.DollarSign:        // $=
        case TokenType.Asterisk:          // *=
        case TokenType.VerticalLine:      // |=
            if (_i + 1 < tokens.length && tokens[_i + 1].type === TokenType.EqualsSign) {
                return 2;
            }
    }
}

function getAttrselector() {
    if (pos >= tokens.length) {
        parseError('Attribute selector is expected');
    }

    var startPos = pos;
    var type = tokens[pos].type;
    var name;

    if (type === TokenType.EqualsSign) {
        name = '=';
        pos++;
    } else {
        if (type === TokenType.Tilde ||             // ~=
            type === TokenType.CircumflexAccent ||  // ^=
            type === TokenType.DollarSign ||        // $=
            type === TokenType.Asterisk ||          // *=
            type === TokenType.VerticalLine) {      // |=
            name = tokens[pos++].value + '=';

            expect(pos, TokenType.EqualsSign);
            pos++;
        }
    }

    if (!name) {
        parseError('Attribute selector is expected');
    }

    return [getInfo(startPos), NodeType.AttrselectorType, name];
}

function getBraces() {
    if (pos >= tokens.length) {
        parseError('Unexpected end of input');
    }

    var close;

    if (tokens[pos].type === TokenType.LeftParenthesis) {
        close = TokenType.RightParenthesis;
    } else if (tokens[pos].type === TokenType.LeftSquareBracket) {
        close = TokenType.RightSquareBracket;
    } else {
        parseError('Unexpected input');
    }

    var node = [
        getInfo(pos),
        NodeType.BracesType,
        tokens[pos].value,
        null
    ];

    // left brace
    pos++;

    scan:
    while (pos < tokens.length) {
        switch (tokens[pos].type) {
            case close:
                break scan;

            case TokenType.Space:
                node.push(getS());
                break;

            case TokenType.Comment:
                node.push(getComment());
                break;

            case TokenType.NumberSign: // ??
                node.push(getVhash());
                break;

            case TokenType.LeftParenthesis:
            case TokenType.LeftSquareBracket:
                node.push(getBraces());
                break;

            case TokenType.Solidus:
            case TokenType.Asterisk:
            case TokenType.Comma:
            case TokenType.Colon:
                node.push(getOperator());
                break;

            default:
                node.push(getAny());
        }
    }

    // right brace
    expect(pos, close);
    node[3] = tokens[pos].value;
    pos++;

    return node;
}

// '.' ident
// FIXME: class names are ident and can't starts with number
function getClass() {
    var startPos = pos;
    var name = '';

    expect(pos, TokenType.FullStop);
    pos++;

    if (pos < tokens.length) {
        if (tokens[pos].type === TokenType.DecimalNumber) {
            name = tokens[pos].value;
            pos++;
        }

        if (pos < tokens.length) {
            return [
                getInfo(startPos),
                NodeType.ClassType,
                [
                    getInfo(startPos + 1),
                    NodeType.IdentType,
                    name + readIdent()
                ]
            ];
        }
    }

    parseError('Unexpected end of input');
}

// '#' ident
// FIXME: ids are ident and can't starts with number
function getShash() {
    var startPos = pos;

    expect(pos, TokenType.NumberSign);
    pos++;

    var name = tokens[pos].value;

    if (tokens[pos++].type === TokenType.DecimalNumber) {
        if (pos < tokens.length && tokens[pos].type === TokenType.Identifier) {
            name += tokens[pos++].value;
        }
    }

    return [
        getInfo(startPos),
        NodeType.ShashType,
        name
    ];
}

// + | > | ~ | /deep/
function getCombinator() {
    var info = getInfo(pos);
    var combinator;

    switch (tokens[pos].type) {
        case TokenType.PlusSign:
        case TokenType.GreaterThanSign:
        case TokenType.Tilde:
            combinator = tokens[pos].value;
            pos++;
            break;

        case TokenType.Solidus:
            expect(pos + 1, TokenType.Identifier);
            expect(pos + 2, TokenType.Solidus);

            if (tokens[pos + 1].value === 'deep') {
                combinator = '/deep/';
                pos += 3;
            } else {
                parseError('Unexpected identifier');
            }
            break;

        default:
            parseError('Combinator is expected');
    }

    return [info, NodeType.CombinatorType, combinator];
}

// node: Comment
function getComment() {
    expect(pos, TokenType.Comment);

    var value = tokens[pos].value;
    var len = value.length;

    if (len > 4 && value.charAt(len - 2) === '*' && value.charAt(len - 1) === '/') {
        len -= 2;
    }

    return [getInfo(pos++), NodeType.CommentType, value.substring(2, len)];
}

// ;
function getDecldelim() {
    return [getInfo(pos++), NodeType.DecldelimType];
}

// ,
function getDelim() {
    return [getInfo(pos++), NodeType.DelimType];
}

// number ident
function getDimension(startPos, number) {
    return [
        getInfo(startPos || pos),
        NodeType.DimensionType,
        number || getNumber(),
        getIdentifier()
    ];
}

// expression '(' raw ')'
function getFunctionExpression(startPos, ident) {
    var raw = '';
    var balance = 0;

    if (!startPos) {
        startPos = pos;
    }

    if (!ident) {
        ident = getIdentifier();
    }

    if (ident[2] !== 'expression') {
        parseError('`expression` is expected');
    }

    expect(pos, TokenType.LeftParenthesis);
    pos++;

    while (pos < tokens.length) {
        if (tokens[pos].type === TokenType.RightParenthesis) {
            if (balance === 0) {
                break;
            }

            balance--;
        } else if (tokens[pos].type === TokenType.LeftParenthesis) {
            balance++;
        }

        raw += tokens[pos++].value;
    }

    expect(pos, TokenType.RightParenthesis);
    pos++;

    return [
        getInfo(startPos),
        NodeType.FunctionExpressionType,
        raw
    ];
}

// ident '(' functionBody ')' |
// not '(' <simpleSelector>* ')'
function getFunction(startPos, ident) {
    if (!startPos) {
        startPos = pos;
    }

    if (!ident) {
        ident = getIdentifier();
    }

    expect(pos, TokenType.LeftParenthesis);
    pos++;

    var body = ident[2] !== 'not'
        ? getFunctionBody()
        : getNotFunctionBody(); // ok, here we have CSS3 initial draft: http://dev.w3.org/csswg/selectors3/#negation

    return [getInfo(startPos), NodeType.FunktionType, ident, body];
}

function getFunctionBody() {
    var node = [getInfo(pos), NodeType.FunctionBodyType];

    scan:
    while (pos < tokens.length) {
        switch (tokens[pos].type) {
            case TokenType.RightParenthesis:
                break scan;

            case TokenType.Space:
                node.push(getS());
                break;

            case TokenType.Comment:
                node.push(getComment());
                break;

            case TokenType.NumberSign: // TODO: not sure it should be here
                node.push(getVhash());
                break;

            case TokenType.LeftParenthesis:
            case TokenType.LeftSquareBracket:
                node.push(getBraces());
                break;

            case TokenType.Solidus:
            case TokenType.Asterisk:
            case TokenType.Comma:
            case TokenType.Colon:
            case TokenType.EqualsSign:
                node.push(getOperator());
                break;

            default:
                node.push(getAny());
        }
    }

    expect(pos, TokenType.RightParenthesis);
    pos++;

    return node;
}

function getNotFunctionBody() {
    var node = [getInfo(pos), NodeType.FunctionBodyType];

    while (pos < tokens.length) {
        switch (tokens[pos].type) {
            case TokenType.RightParenthesis:
                pos++;
                return node;

            default:
                node.push(getSimpleSelector(true));
        }
    }
}

function getUnicodeRange(tryNext) {
    var hex = '';

    for (; pos < tokens.length; pos++) {
        if (tokens[pos].type !== TokenType.DecimalNumber &&
            tokens[pos].type !== TokenType.Identifier) {
            break;
        }

        hex += tokens[pos].value;
    }

    if (/^[0-9a-f]{1,6}$/i.test(hex)) {
        // U+abc???
        if (tryNext) {
            for (; hex.length < 6 && pos < tokens.length; pos++) {
                if (tokens[pos].type !== TokenType.QuestionMark) {
                    break;
                }

                hex += tokens[pos].value;
                tryNext = false;
            }
        }

        // U+aaa-bbb
        if (tryNext) {
            if (pos < tokens.length && tokens[pos].type === TokenType.HyphenMinus) {
                pos++;
                var next = getUnicodeRange(false);

                if (!next) {
                    parseError('Unexpected input');
                }

                hex += '-' + next;
            }
        }
    } else {
        parseError('Unexpected input');
    }

    return hex;
}

function readIdent() {
    var name = '';

    // optional first -
    if (pos < tokens.length && tokens[pos].type === TokenType.HyphenMinus) {
        name = '-';
        pos++;
    }

    if (pos < tokens.length) {
        expectAny(pos,
            TokenType.LowLine,
            TokenType.Identifier
        );

        name += tokens[pos].value;
        pos++;

        for (; pos < tokens.length; pos++) {
            var type = tokens[pos].type;
            if (type !== TokenType.LowLine &&
                type !== TokenType.Identifier &&
                type !== TokenType.DecimalNumber &&
                type !== TokenType.HyphenMinus) {
                break;
            }

            name += tokens[pos].value;
        }
    } else {
        if (!name) {
            parseError('Identifier expected');
        }
    }

    return name;
}

function getNamespacedIdentifier(checkColon) {
    if (pos >= tokens.length) {
        parseError('Identifier expected');
    }

    var info = getInfo(pos);
    var name;

    if (tokens[pos].type === TokenType.Asterisk) {
        checkColon = false;
        name = '*';
        pos++;
    } else {
        name = readIdent();
    }

    if (pos < tokens.length) {
        if (tokens[pos].type === TokenType.VerticalLine &&
            pos + 1 < tokens.length &&
            tokens[pos + 1].type !== TokenType.EqualsSign) {
            name += '|';
            pos++;

            if (pos < tokens.length) {
                if (tokens[pos].type === TokenType.HyphenMinus ||
                    tokens[pos].type === TokenType.Identifier ||
                    tokens[pos].type === TokenType.LowLine) {
                    name += readIdent();
                } else if (tokens[pos].type === TokenType.Asterisk) {
                    checkColon = false;
                    name += '*';
                    pos++;
                }
            }
        }
    }

    if (checkColon && pos < tokens.length && tokens[pos].type === TokenType.Colon) {
        pos++;
        name += ':' + readIdent();
    }

    return [
        info,
        NodeType.IdentType,
        name
    ];
}

function getIdentifier() {
    return [getInfo(pos), NodeType.IdentType, readIdent()];
}

// ! ws* important
function getImportant() {
    expect(pos, TokenType.ExclamationMark);
    pos++;

    var node = readSC([getInfo(pos - 1), NodeType.ImportantType]);

    expect(pos, TokenType.Identifier);
    if (tokens[pos].value.toLowerCase() !== 'important') {
        parseError('`important` keyword expected');
    }

    pos++;

    return node;
}

// odd | even | number? n
function getNth() {
    expectAny(pos,
        TokenType.Identifier,
        TokenType.DecimalNumber
    );

    var startPos = pos;
    var value = tokens[pos].value;

    if (tokens[pos].type === TokenType.DecimalNumber) {
        if (pos + 1 < tokens.length &&
            tokens[pos + 1].type === TokenType.Identifier &&
            tokens[pos + 1].value === 'n') {
            value += 'n';
            pos++;
        }
    } else {
        if (value !== 'odd' && value !== 'even' && value !== 'n') {
            parseError('Unexpected identifier');
        }
    }

    pos++;

    return [
        getInfo(startPos),
        NodeType.NthType,
        value
    ];
}

function getNthSelector() {
    expect(pos, TokenType.Colon);
    pos++;

    if (pos >= tokens[pos].length ||
        tokens[pos].type !== TokenType.Identifier ||
        tokens[pos].value !== 'nth') { // TODO: should be case insensitive?
        parseError('Expecting `nth` identifier');
    }

    var node = [getInfo(pos - 1), NodeType.NthselectorType, getIdentifier()];

    expect(pos, TokenType.LeftParenthesis);
    pos++;

    scan:
    while (pos < tokens.length) {
        switch (tokens[pos].type) {
            case TokenType.RightParenthesis:
                break scan;

            case TokenType.Space:
                node.push(getS());
                break;

            case TokenType.Comment:
                node.push(getComment());
                break;

            case TokenType.HyphenMinus:
            case TokenType.PlusSign:
                node.push(getUnary());
                break;

            default:
                node.push(getNth());
        }
    }

    expect(pos, TokenType.RightParenthesis);
    pos++;

    return node;
}

function tryGetNumber() {
    var startPos = pos;
    var wasDigits = false;
    var number = '';
    var i = pos;

    if (i < tokens.length && tokens[i].type === TokenType.HyphenMinus) {
        number = '-';
        i++;
    }

    if (i < tokens.length && tokens[i].type === TokenType.DecimalNumber) {
        wasDigits = true;
        number += tokens[i].value;
        i++;
    }

    if (i < tokens.length && tokens[i].type === TokenType.FullStop) {
        number += '.';
        i++;
    }

    if (i < tokens.length && tokens[i].type === TokenType.DecimalNumber) {
        wasDigits = true;
        number += tokens[i].value;
        i++;
    }

    if (wasDigits) {
        pos = i;
        return [getInfo(startPos), NodeType.NumberType, number];
    }

    return null;
}

function getNumber() {
    var number = tryGetNumber();

    if (!number) {
        parseError('Wrong number');
    }

    return number;
}

// '/' | '*' | ',' | ':' | '='
// TODO: remove '=' since it's wrong operator, but theat as operator
// to make old things like `filter: alpha(opacity=0)` works
function getOperator() {
    var type = tokens[pos].type;

    if (type !== TokenType.Solidus &&
        type !== TokenType.Asterisk &&
        type !== TokenType.Comma &&
        type !== TokenType.Colon &&
        type !== TokenType.EqualsSign) {
        parseError('Operator expected');
    }

    return [getInfo(pos), NodeType.OperatorType, tokens[pos++].value];
}

// node: Percentage
function tryGetPercentage() {
    var startPos = pos;
    var number = tryGetNumber(pos);

    if (number &&
        pos < tokens.length &&
        tokens[pos].type === TokenType.PercentSign) {
        return getPercentage(startPos, number);
    }

    return null;
}

function getPercentage(startPos, number) {
    if (!startPos) {
        startPos = pos;
    }

    if (!number) {
        number = getNumber();
    }

    expect(pos, TokenType.PercentSign);
    pos++;

    return [getInfo(startPos), NodeType.PercentageType, number];
}

function getFilterv() {
    var node = createToken(NodeType.FiltervType);

    while (checkProgid(pos)) {
        node.push(getProgid());
    }

    readSC(node);

    if (pos < tokens.length && tokens[pos].type === TokenType.ExclamationMark) {
        node.push(getImportant());
    }

    return node;
}

// 'progid:' ws* 'DXImageTransform.Microsoft.' ident ws* '(' .* ')'
function checkProgid(_i) {
    var start = _i;

    _i += checkSC(_i);

    if (_i + 1 >= tokens.length ||
        tokens[_i + 0].value !== 'progid' ||
        tokens[_i + 1].type !== TokenType.Colon) {
        return false; // fail
    }

    _i += 2;
    _i += checkSC(_i);

    if (_i + 6 >= tokens.length ||
        tokens[_i + 0].value !== 'DXImageTransform' ||
        tokens[_i + 1].type !== TokenType.FullStop ||
        tokens[_i + 2].value !== 'Microsoft' ||
        tokens[_i + 3].type !== TokenType.FullStop ||
        tokens[_i + 4].type !== TokenType.Identifier) {
        return false; // fail
    }

    _i += 5;
    _i += checkSC(_i);

    if (_i >= tokens.length ||
        tokens[_i].type !== TokenType.LeftParenthesis) {
        return false; // fail
    }

    while (_i < tokens.length) {
        if (tokens[_i++].type === TokenType.RightParenthesis) {
            break;
        }
    }

    tokens[start].progidEnd = _i;

    return true;
}

function getProgid() {
    var node = [getInfo(pos), NodeType.ProgidType];
    var progidEnd = tokens[pos].progidEnd;
    var value = '';

    if (!progidEnd) {
        if (!checkProgid()) {
            parseError('progid is expected');
        }
    }

    readSC(node);

    var rawStart = pos;
    for (; pos < progidEnd; pos++) {
        value += tokens[pos].value;
    }

    node.push([
        getInfo(rawStart),
        NodeType.RawType,
        value
    ]);

    readSC(node);

    return node;
}

// <pseudo-element> | <pseudo-class> | <nth-selector>
function getPseudo() {
    expect(pos, TokenType.Colon);

    if (pos + 1 < tokens.length) {
        var next = tokens[pos + 1];

        if (next.type === TokenType.Colon) {
            return getPseudoe();
        }

        if (next.type === TokenType.Identifier &&
            next.value === 'nth') {
            return getNthSelector();
        }

        return getPseudoc();
    }

    parseError('Unexpected end of input');
}

// :: ident
function getPseudoe() {
    expect(pos, TokenType.Colon);
    pos++;

    expect(pos, TokenType.Colon);
    pos++;

    return [getInfo(pos - 1), NodeType.PseudoeType, getIdentifier()];
}

// : ( ident | function )
function getPseudoc() {
    var startPos = pos;

    expect(pos, TokenType.Colon);
    pos++;

    var value = getIdentifier();

    if (pos < tokens.length && tokens[pos].type === TokenType.LeftParenthesis) {
        value = getFunction(startPos, value);
    }

    return [
        getInfo(startPos),
        NodeType.PseudocType,
        value
    ];
}

// ws
function getS() {
    return [getInfo(pos), NodeType.SType, tokens[pos++].value];
}

function checkSC(_i) {
    var start = _i;

    while (_i < tokens.length) {
        if (tokens[_i].type === TokenType.Space ||
            tokens[_i].type === TokenType.Comment) {
            _i++;
        } else {
            break;
        }
    }

    if (_i !== start) {
        return _i - start;
    }

    return 0;
}

function readSC(node) {
    scan:
    while (pos < tokens.length) {
        switch (tokens[pos].type) {
            case TokenType.Space:
                node.push(getS());
                break;

            case TokenType.Comment:
                node.push(getComment());
                break;

            default:
                break scan;
        }
    }

    return node;
}

// node: String
function getString() {
    return [getInfo(pos), NodeType.StringType, tokens[pos++].value];
}

// '+' | '-'
function getUnary() {
    expectAny(pos,
        TokenType.HyphenMinus,
        TokenType.PlusSign
    );

    return [getInfo(pos), NodeType.UnaryType, tokens[pos++].value];
}

// '//' ...
// TODO: remove it as wrong thing
function getUnknown() {
    expect(pos, TokenType.Unknown);

    return [getInfo(pos), NodeType.UnknownType, tokens[pos++].value];
}

// url '(' ws* (string | raw) ws* ')'
function getUri(startPos, ident) {
    var node = [getInfo(startPos || pos), NodeType.UriType];

    if (!ident) {
        ident = getIdentifier();
    }

    if (ident[2] !== 'url') {
        parseError('`url` is expected');
    }

    expect(pos, TokenType.LeftParenthesis);
    pos++;

    readSC(node);

    if (tokens[pos].type === TokenType.String) {
        node.push(getString());
        readSC(node);
    } else {
        var rawStart = pos;
        var raw = '';

        while (pos < tokens.length) {
            var type = tokens[pos].type;

            if (type === TokenType.Space ||
                type === TokenType.LeftParenthesis ||
                type === TokenType.RightParenthesis) {
                break;
            }

            raw += tokens[pos++].value;
        }

        node.push([
            getInfo(rawStart),
            NodeType.RawType,
            raw
        ]);

        readSC(node);
    }

    expect(pos, TokenType.RightParenthesis);
    pos++;  // )

    return node;
}

// # ident
function getVhash() {
    expect(pos, TokenType.NumberSign);
    pos++;

    var name = tokens[pos].value;

    if (tokens[pos++].type === TokenType.DecimalNumber) {
        if (pos < tokens.length && tokens[pos].type === TokenType.Identifier) {
            name += tokens[pos++].value;
        }
    }

    return [getInfo(pos - 1), NodeType.VhashType, name];
}

module.exports = function parse(source, rule, options) {
    var ast;

    options = options || {};

    if (options === true) {
        options = {
            needPositions: true,
            needInfo: true
        };
    }

    needPositions = options.needPositions || false;
    filename = options.filename || null;
    rule = rule || 'stylesheet';
    pos = 0;

    tokens = tokenize(source);

    if (tokens.length) {
        ast = CSSPRules[rule]();
    }

    tokens = null; // drop tokens

    if (!ast && rule === 'stylesheet') {
        ast = [{}, rule];
    }

    if (ast && !options.needInfo) {
        ast = cleanInfo(ast);
    }

    // console.log(require('../utils/stringify.js')(require('../utils/cleanInfo.js')(ast), true));
    return ast;
};
