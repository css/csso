'use strict';

var TokenType = require('./const.js').TokenType;
var NodeType = require('./const.js').NodeType;
var tokenize = require('./tokenize.js');
var cleanInfo = require('../utils/cleanInfo.js');
var needPositions;
var filename;
var tokens;
var pos;

var rules = {
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
            lines = tokens[pos].value.trimRight().split(/\n|\r\n?|\f/);
            line = tokens[pos].line + lines.length - 1;
            column = lines.length > 1
                ? lines[lines.length - 1].length + 1
                : tokens[pos].column + lines[lines.length - 1].length;
        }

    }

    error.name = 'CssSyntaxError';
    error.parseError = {
        line: line,
        column: column
    };

    throw error;
}

function eat(tokenType) {
    if (pos < tokens.length && tokens[pos].type === tokenType) {
        pos++;
        return true;
    }

    parseError(tokenType + ' is expected');
}

function expectIdentifier(name, eat) {
    if (pos < tokens.length) {
        var token = tokens[pos];
        if (token.type === TokenType.Identifier &&
            token.value.toLowerCase() === name) {
            if (eat) {
                pos++;
            }

            return true;
        }
    }

    parseError('Identifier `' + name + '` is expected');
}

function expectAny(what) {
    if (pos < tokens.length) {
        for (var i = 1, type = tokens[pos].type; i < arguments.length; i++) {
            if (type === arguments[i]) {
                return true;
            }
        }
    }

    parseError(what + ' is expected');
}

function getInfo(idx) {
    if (needPositions && idx < tokens.length) {
        var token = tokens[idx];

        return {
            source: filename,
            offset: token.offset,
            line: token.line,
            column: token.column
        };
    }

    return null;

}

function getStylesheet(nested) {
    var stylesheet = [getInfo(pos), NodeType.StylesheetType];

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
    eat(TokenType.CommercialAt);

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

            case TokenType.Colon:
                node.push(getPseudo());
                break;

            case TokenType.LeftParenthesis:
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
    var selector = [getInfo(pos), NodeType.SelectorType];

    scan:
    while (pos < tokens.length) {
        switch (tokens[pos].type) {
            case TokenType.LeftCurlyBracket:
                break scan;

            case TokenType.Comma:
                selector.push([
                    getInfo(pos++),
                    NodeType.DelimType
                ]);
                break;

            default:
                selector.push(getSimpleSelector());
        }
    }

    return selector;
}

function getSimpleSelector(nested) {
    var node = [getInfo(pos), NodeType.SimpleselectorType];

    scan:
    while (pos < tokens.length) {
        switch (tokens[pos].type) {
            case TokenType.Comma:
                break scan;

            case TokenType.LeftCurlyBracket:
                if (nested) {
                    parseError('Unexpected input');
                }

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

            case TokenType.HyphenMinus:
            case TokenType.LowLine:
            case TokenType.Identifier:
            case TokenType.Asterisk:
            case TokenType.DecimalNumber:
                node.push(
                    tryGetPercentage() ||
                    getNamespacedIdentifier(false)
                );
                break;

            default:
                parseError('Unexpected input');
        }
    }

    return node;
}

function getBlock() {
    var node = [getInfo(pos), NodeType.BlockType];

    eat(TokenType.LeftCurlyBracket);

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

            case TokenType.Semicolon: // ;
                node.push([
                    getInfo(pos++),
                    NodeType.DecldelimType
                ]);
                break;

            default:
                node.push(getDeclaration());
        }
    }

    eat(TokenType.RightCurlyBracket);

    return node;
}

function getDeclaration() {
    var startPos = pos;
    var info = getInfo(pos);
    var property = getProperty();

    eat(TokenType.Colon);

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
    var node = [getInfo(pos), NodeType.ValueType];

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
            }

            if (tokens[pos].type === TokenType.HyphenMinus &&
                pos < tokens.length &&
                (tokens[pos + 1].type === TokenType.Identifier || tokens[pos + 1].type === TokenType.HyphenMinus)) {
                break;
            }

            if (tokens[pos].type === TokenType.HyphenMinus ||
                tokens[pos].type === TokenType.PlusSign) {
                return getUnary();
            }

            parseError('Unexpected input');
            break;

        case TokenType.HyphenMinus:
        case TokenType.LowLine:
        case TokenType.Identifier:
            break;

        default:
            parseError('Unexpected input');
    }

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

// '[' S* attrib_name ']'
// '[' S* attrib_name attrib_match [ IDENT | STRING ] S* attrib_flags? ']'
function getAttrib() {
    var node = [getInfo(pos), NodeType.AttribType];

    eat(TokenType.LeftSquareBracket);

    readSC(node);

    node.push(getNamespacedIdentifier(true));

    readSC(node);

    if (pos < tokens.length && tokens[pos].type !== TokenType.RightSquareBracket) {
        node.push(getAttrselector());
        readSC(node);

        if (pos < tokens.length && tokens[pos].type === TokenType.String) {
            node.push(getString());
        } else {
            node.push(getIdentifier());
        }

        readSC(node);

        // attribute flags
        if (pos < tokens.length && tokens[pos].type === TokenType.Identifier) {
            node.push([
                getInfo(pos),
                'attribFlags',
                tokens[pos++].value
            ]);
            readSC(node);
        }
    }

    eat(TokenType.RightSquareBracket);

    return node;
}

function getAttrselector() {
    expectAny('Attribute selector (=, ~=, ^=, $=, *=, |=)',
        TokenType.EqualsSign,        // =
        TokenType.Tilde,             // ~=
        TokenType.CircumflexAccent,  // ^=
        TokenType.DollarSign,        // $=
        TokenType.Asterisk,          // *=
        TokenType.VerticalLine       // |=
    );

    var startPos = pos;
    var name;

    if (tokens[pos].type === TokenType.EqualsSign) {
        name = '=';
        pos++;
    } else {
        name = tokens[pos].value + '=';
        pos++;
        eat(TokenType.EqualsSign);
    }

    return [getInfo(startPos), NodeType.AttrselectorType, name];
}

function getBraces() {
    expectAny('Parenthesis or square bracket',
        TokenType.LeftParenthesis,
        TokenType.LeftSquareBracket
    );

    var close;

    if (tokens[pos].type === TokenType.LeftParenthesis) {
        close = TokenType.RightParenthesis;
    } else {
        close = TokenType.RightSquareBracket;
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
                node[3] = tokens[pos].value;
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
    eat(close);

    return node;
}

// '.' ident
function getClass() {
    var startPos = pos;

    eat(TokenType.FullStop);

    return [
        getInfo(startPos),
        NodeType.ClassType,
        getIdentifier()
    ];
}

// '#' ident
// FIXME: shash node should has structure like other ident's (['shash', ['ident', ident]])
function getShash() {
    var startPos = pos;

    eat(TokenType.NumberSign);

    return [
        getInfo(startPos),
        NodeType.ShashType,
        readIdent()
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
            combinator = '/deep/';
            pos++;

            expectIdentifier('deep', true);

            eat(TokenType.Solidus);
            break;

        default:
            parseError('Combinator (+, >, ~, /deep/) is expected');
    }

    return [info, NodeType.CombinatorType, combinator];
}

// '/*' .* '*/'
function getComment() {
    var value = tokens[pos].value;
    var len = value.length;

    if (len > 4 && value.charAt(len - 2) === '*' && value.charAt(len - 1) === '/') {
        len -= 2;
    }

    return [getInfo(pos++), NodeType.CommentType, value.substring(2, len)];
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

    eat(TokenType.LeftParenthesis);

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

    eat(TokenType.RightParenthesis);

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

    eat(TokenType.LeftParenthesis);

    var body = ident[2] === 'not'
        ? getNotFunctionBody()
        : getFunctionBody();

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

    eat(TokenType.RightParenthesis);

    return node;
}

function getNotFunctionBody() {
    var node = [getInfo(pos), NodeType.FunctionBodyType];
    var wasSelector = false;

    scan:
    while (pos < tokens.length) {
        switch (tokens[pos].type) {
            case TokenType.RightParenthesis:
                if (!wasSelector) {
                    parseError('Simple selector is expected');
                }

                break scan;

            case TokenType.Comma:
                if (!wasSelector) {
                    parseError('Simple selector is expected');
                }

                wasSelector = false;
                node.push([
                    getInfo(pos++),
                    NodeType.DelimType
                ]);
                break;

            default:
                wasSelector = true;
                node.push(getSimpleSelector(true));
        }
    }

    eat(TokenType.RightParenthesis);

    return node;
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

    if (!/^[0-9a-f]{1,6}$/i.test(hex)) {
        parseError('Unexpected input');
    }

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

    return hex;
}

function readIdent() {
    var name = '';

    // optional first -
    if (pos < tokens.length && tokens[pos].type === TokenType.HyphenMinus) {
        name = '-';
        pos++;
    }

    expectAny('Identifier',
        TokenType.LowLine,
        TokenType.Identifier
    );

    if (pos < tokens.length) {
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
    }

    return name;
}

function getNamespacedIdentifier(checkColon) {
    if (pos >= tokens.length) {
        parseError('Unexpected end of input');
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
    eat(TokenType.ExclamationMark);

    var node = readSC([getInfo(pos - 1), NodeType.ImportantType]);

    expectIdentifier('important', true);

    return node;
}

// odd | even | number? n
function getNth() {
    expectAny('Number, odd or even',
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
    eat(TokenType.Colon);
    expectIdentifier('nth', false);

    var node = [getInfo(pos - 1), NodeType.NthselectorType, getIdentifier()];

    eat(TokenType.LeftParenthesis);

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

    eat(TokenType.RightParenthesis);

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
    expectAny('Operator',
        TokenType.Solidus,
        TokenType.Asterisk,
        TokenType.Comma,
        TokenType.Colon,
        TokenType.EqualsSign
    );

    return [getInfo(pos), NodeType.OperatorType, tokens[pos++].value];
}

// node: Percentage
function tryGetPercentage() {
    var startPos = pos;
    var number = tryGetNumber();

    if (!number) {
        return null;
    }

    if (pos >= tokens.length || tokens[pos].type !== TokenType.PercentSign) {
        return null;
    }

    return getPercentage(startPos, number);
}

function getPercentage(startPos, number) {
    if (!startPos) {
        startPos = pos;
    }

    if (!number) {
        number = getNumber();
    }

    eat(TokenType.PercentSign);

    return [getInfo(startPos), NodeType.PercentageType, number];
}

function getFilterv() {
    var node = [getInfo(pos), NodeType.FiltervType];

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
function checkSC(i) {
    var start = i;

    while (i < tokens.length) {
        if (tokens[i].type === TokenType.Space ||
            tokens[i].type === TokenType.Comment) {
            i++;
        } else {
            break;
        }
    }

    return i - start;
}

function checkProgid(i) {
    var start = i;

    i += checkSC(i);

    if (i + 1 >= tokens.length ||
        tokens[i + 0].value !== 'progid' ||
        tokens[i + 1].type !== TokenType.Colon) {
        return false; // fail
    }

    i += 2;
    i += checkSC(i);

    if (i + 6 >= tokens.length ||
        tokens[i + 0].value !== 'DXImageTransform' ||
        tokens[i + 1].type !== TokenType.FullStop ||
        tokens[i + 2].value !== 'Microsoft' ||
        tokens[i + 3].type !== TokenType.FullStop ||
        tokens[i + 4].type !== TokenType.Identifier) {
        return false; // fail
    }

    i += 5;
    i += checkSC(i);

    if (i >= tokens.length ||
        tokens[i].type !== TokenType.LeftParenthesis) {
        return false; // fail
    }

    while (i < tokens.length) {
        if (tokens[i++].type === TokenType.RightParenthesis) {
            break;
        }
    }

    tokens[start].progidEnd = i;

    return true;
}

function getProgid() {
    var node = [getInfo(pos), NodeType.ProgidType];
    var progidEnd = tokens[pos].progidEnd;
    var value = '';

    if (!progidEnd && !checkProgid(pos)) {
        parseError('progid is expected');
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

// <pseudo-element> | <nth-selector> | <pseudo-class>
function getPseudo() {
    if (pos >= tokens.length || tokens[pos].type !== TokenType.Colon) {
        parseError('Colon is expected');
    }

    if (pos + 1 >= tokens.length) {
        pos++;
        parseError('Colon or identifier is expected');
    }

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

// :: ident
function getPseudoe() {
    eat(TokenType.Colon);
    eat(TokenType.Colon);

    return [getInfo(pos - 2), NodeType.PseudoeType, getIdentifier()];
}

// : ( ident | function )
function getPseudoc() {
    var startPos = pos;
    var value = eat(TokenType.Colon) && getIdentifier();

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
    expectAny('Unary operator',
        TokenType.HyphenMinus,
        TokenType.PlusSign
    );

    return [getInfo(pos), NodeType.UnaryType, tokens[pos++].value];
}

// '//' ...
// TODO: remove it as wrong thing
function getUnknown() {
    eat(TokenType.Unknown);

    return [getInfo(pos - 1), NodeType.UnknownType, tokens[pos - 1].value];
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

    eat(TokenType.LeftParenthesis); // (

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

    eat(TokenType.RightParenthesis); // )

    return node;
}

// # ident
function getVhash() {
    eat(TokenType.NumberSign);

    expectAny('Number or identifier',
        TokenType.DecimalNumber,
        TokenType.Identifier
    );

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
            positions: true,
            needInfo: true
        };
    }

    if ('positions' in options) {
        needPositions = options.positions || false;
    } else {
        // deprecated option but using for backward capability
        needPositions = options.needPositions || false;
    }

    filename = options.filename || '<unknown>';
    rule = rule || 'stylesheet';
    pos = 0;

    tokens = tokenize(source);

    if (tokens.length) {
        ast = rules[rule]();
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
