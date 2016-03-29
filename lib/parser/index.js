'use strict';

var TokenType = require('./const.js').TokenType;
var NodeType = require('./const.js').NodeType;
var Scanner = require('./scanner.js');
var cleanInfo = require('../utils/cleanInfo.js');
var needPositions;
var filename;
var pos;
var scanner;

var SCOPE_ATRULE_EXPRESSION = 1;
var SCOPE_SELECTOR = 2;
var SCOPE_VALUE = 3;

var specialFunctions = {};
specialFunctions[SCOPE_ATRULE_EXPRESSION] = {
    url: getUri
};
specialFunctions[SCOPE_SELECTOR] = {
    url: getUri,
    not: getNotFunction
};
specialFunctions[SCOPE_VALUE] = {
    url: getUri,
    expression: getOldIEExpression,
    var: getVarFunction
};

var rules = {
    // stylesheet, selector, simpleSelector, block, value, atruleExpression
    'atkeyword': getAtkeyword,
    'atrule': getAtrule,
    'attribute': getAttribute,
    'block': getBlockWithBrackets,
    'braces': getBraces,
    'class': getClass,
    'combinator': getCombinator,
    'comment': getComment,
    'declaration': getDeclaration,
    'declarations': getBlock,
    'dimension': getDimension,
    'function': getFunction,
    'ident': getIdentifier,
    'important': getImportant,
    'nth': getNth,
    'nthselector': getNthSelector,
    'number': getNumber,
    'operator': getOperator,
    'percentage': getPercentage,
    'progid': getProgid,
    'property': getProperty,
    'pseudoClass': getPseudoClass,
    'pseudoElement': getPseudoElement,
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
    'vhash': getVhash,

    // TODO: remove in 2.0
    // for backward capability
    'atruleb': getAtrule,
    'atruler': getAtrule,
    'atrules': getAtrule,
    'attrib': getAttribute,
    'attrselector': getAttrselector,
    'clazz': getClass,
    'filter': getDeclaration,
    'functionExpression': getOldIEExpression,
    'funktion': getFunction,
    'pseudoc': getPseudoClass,
    'pseudoe': getPseudoElement
};

var blockMode = {
    'declaration': true,
    'property': true
};

function parseError(message) {
    var error = new Error(message);
    var line = 1;
    var column = 1;
    var lines;

    if (scanner.token !== null) {
        line = scanner.token.line;
        column = scanner.token.column;
    } else if (scanner.prevToken !== null) {
        lines = scanner.prevToken.value.trimRight().split(/\n|\r\n?|\f/);
        line = scanner.prevToken.line + lines.length - 1;
        column = lines.length > 1
            ? lines[lines.length - 1].length + 1
            : scanner.prevToken.column + lines[lines.length - 1].length;
    }

    error.name = 'CssSyntaxError';
    error.parseError = {
        line: line,
        column: column
    };

    throw error;
}

function eat(tokenType) {
    if (scanner.token !== null && scanner.token.type === tokenType) {
        scanner.next();
        return true;
    }

    parseError(tokenType + ' is expected');
}

function expectIdentifier(name, eat) {
    if (scanner.token !== null) {
        if (scanner.token.type === TokenType.Identifier &&
            scanner.token.value.toLowerCase() === name) {
            if (eat) {
                scanner.next();
            }

            return true;
        }
    }

    parseError('Identifier `' + name + '` is expected');
}

function expectAny(what) {
    if (scanner.token !== null) {
        for (var i = 1, type = scanner.token.type; i < arguments.length; i++) {
            if (type === arguments[i]) {
                return true;
            }
        }
    }

    parseError(what + ' is expected');
}

function getInfo() {
    if (needPositions && scanner.token) {
        return {
            source: filename,
            offset: scanner.token.offset,
            line: scanner.token.line,
            column: scanner.token.column
        };
    }

    return null;

}

function getStylesheet(nested) {
    var stylesheet = [getInfo(), NodeType.StylesheetType];

    scan:
    while (scanner.token !== null) {
        switch (scanner.token.type) {
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

function isBlockAtrule() {
    for (var offset = 1, cursor; cursor = scanner.lookup(offset); offset++) {
        var type = cursor.type;

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
    var info = getInfo();

    eat(TokenType.CommercialAt);

    return [
        info,
        NodeType.AtkeywordType,
        getIdentifier()
    ];
}

function getAtrule() {
    var node = [getInfo(), NodeType.AtrulesType, getAtkeyword()];

    scan:
    while (scanner.token !== null) {
        switch (scanner.token.type) {
            case TokenType.Semicolon:
                scanner.next();
                break scan;

            case TokenType.LeftCurlyBracket:
                if (isBlockAtrule()) {
                    node[1] = NodeType.AtrulebType;
                    node.push(getBlockWithBrackets());
                } else {
                    node[1] = NodeType.AtrulerType;
                    node.push([
                        {},
                        NodeType.AtrulerqType
                    ].concat(node.splice(3)));

                    scanner.next();  // {

                    var stylesheet = getStylesheet(true);
                    stylesheet[1] = NodeType.AtrulersType;
                    node.push(stylesheet);

                    scanner.next();  // }
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
                node.push(getBraces(SCOPE_ATRULE_EXPRESSION));
                break;

            default:
                node.push(getAny(SCOPE_ATRULE_EXPRESSION));
        }
    }

    return node;
}

function getRuleset() {
    return [
        getInfo(),
        NodeType.RulesetType,
        getSelector(),
        getBlockWithBrackets()
    ];
}

function getSelector() {
    var selector = [getInfo(), NodeType.SelectorType];

    scan:
    while (scanner.token !== null) {
        switch (scanner.token.type) {
            case TokenType.LeftCurlyBracket:
                break scan;

            case TokenType.Comma:
                selector.push([
                    getInfo(),
                    NodeType.DelimType
                ]);
                scanner.next();
                break;

            default:
                selector.push(getSimpleSelector());
        }
    }

    return selector;
}

function getSimpleSelector(nested) {
    var node = [getInfo(), NodeType.SimpleselectorType];

    scan:
    while (scanner.token !== null) {
        switch (scanner.token.type) {
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
                node.push(getAttribute());
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

function getBlockWithBrackets() {
    var info = getInfo();
    var node;

    eat(TokenType.LeftCurlyBracket);
    node = getBlock(info);
    eat(TokenType.RightCurlyBracket);

    return node;
}

function getBlock(info) {
    var node = [info || getInfo(), NodeType.BlockType];

    scan:
    while (scanner.token !== null) {
        switch (scanner.token.type) {
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
                    getInfo(),
                    NodeType.DecldelimType
                ]);
                scanner.next();
                break;

            default:
                node.push(getDeclaration());
        }
    }

    return node;
}

function getDeclaration(nested) {
    var info = getInfo();
    var property = getProperty();

    eat(TokenType.Colon);

    // check it's a filter
    if (/filter$/.test(property[2][2].toLowerCase())) { // TODO: !!!
        if (checkProgid()) {
            return [
                info,
                NodeType.FilterType,
                property,
                getFilterValue()
            ];
        }
    }

    return [
        info,
        NodeType.DeclarationType,
        property,
        getValue(nested)
    ];
}

function getProperty() {
    var info = getInfo();
    var name = '';

    for (; scanner.token !== null; scanner.next()) {
        var type = scanner.token.type;

        if (type !== TokenType.Solidus &&
            type !== TokenType.Asterisk &&
            type !== TokenType.DollarSign) {
            break;
        }

        name += scanner.token.value;
    }

    return readSC([
        info,
        NodeType.PropertyType,
        [
            info,
            NodeType.IdentType,
            name + readIdent(true)
        ]
    ]);
}

function getValue(nested) {
    var node = [getInfo(), NodeType.ValueType];

    scan:
    while (scanner.token !== null) {
        switch (scanner.token.type) {
            case TokenType.RightCurlyBracket:
            case TokenType.Semicolon:
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

            case TokenType.NumberSign:
                node.push(getVhash());
                break;

            case TokenType.Solidus:
            case TokenType.Comma:
                node.push(getOperator());
                break;

            case TokenType.LeftParenthesis:
            case TokenType.LeftSquareBracket:
                node.push(getBraces(SCOPE_VALUE));
                break;

            case TokenType.ExclamationMark:
                node.push(getImportant());
                break;

            default:
                // check for unicode range: U+0F00, U+0F00-0FFF, u+0F00??
                if (scanner.token.type === TokenType.Identifier) {
                    var prefix = scanner.token.value;
                    if (prefix === 'U' || prefix === 'u') {
                        if (scanner.lookupType(1, TokenType.PlusSign)) {
                            scanner.next(); // U or u
                            scanner.next(); // +

                            node.push([
                                getInfo(),
                                NodeType.IdentType,
                                prefix + '+' + getUnicodeRange(true)
                            ]);
                        }
                        break;
                    }
                }

                node.push(getAny(SCOPE_VALUE));
        }
    }

    return node;
}

// any = string | percentage | dimension | number | uri | functionExpression | funktion | unary | operator | ident
function getAny(scope) {
    switch (scanner.token.type) {
        case TokenType.String:
            return getString();

        case TokenType.LowLine:
        case TokenType.Identifier:
            break;

        case TokenType.FullStop:
        case TokenType.DecimalNumber:
        case TokenType.HyphenMinus:
        case TokenType.PlusSign:
            var number = tryGetNumber();

            if (number !== null) {
                if (scanner.token !== null) {
                    if (scanner.token.type === TokenType.PercentSign) {
                        return getPercentage(number);
                    } else if (scanner.token.type === TokenType.Identifier) {
                        return getDimension(number);
                    }
                }

                return number;
            }

            if (scanner.token.type === TokenType.HyphenMinus) {
                var next = scanner.lookup(1);
                if (next && (next.type === TokenType.Identifier || next.type === TokenType.HyphenMinus)) {
                    break;
                }
            }

            if (scanner.token.type === TokenType.HyphenMinus ||
                scanner.token.type === TokenType.PlusSign) {
                return getUnary();
            }

            parseError('Unexpected input');

        default:
            parseError('Unexpected input');
    }

    var ident = getIdentifier();

    if (scanner.token !== null && scanner.token.type === TokenType.LeftParenthesis) {
        return getFunction(scope, ident);
    }

    return ident;
}

// '[' S* attrib_name ']'
// '[' S* attrib_name attrib_match [ IDENT | STRING ] S* attrib_flags? ']'
function getAttribute() {
    var node = [getInfo(), NodeType.AttribType];

    eat(TokenType.LeftSquareBracket);

    readSC(node);

    node.push(getNamespacedIdentifier(true));

    readSC(node);

    if (scanner.token !== null && scanner.token.type !== TokenType.RightSquareBracket) {
        node.push(getAttrselector());
        readSC(node);

        if (scanner.token !== null && scanner.token.type === TokenType.String) {
            node.push(getString());
        } else {
            node.push(getIdentifier());
        }

        readSC(node);

        // attribute flags
        if (scanner.token !== null && scanner.token.type === TokenType.Identifier) {
            node.push([
                getInfo(),
                'attribFlags',
                scanner.token.value
            ]);
            scanner.next();
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

    var info = getInfo();
    var name;

    if (scanner.token.type === TokenType.EqualsSign) {
        name = '=';
        scanner.next();
    } else {
        name = scanner.token.value + '=';
        scanner.next();
        eat(TokenType.EqualsSign);
    }

    return [
        info,
        NodeType.AttrselectorType,
        name
    ];
}

function getBraces(scope) {
    expectAny('Parenthesis or square bracket',
        TokenType.LeftParenthesis,
        TokenType.LeftSquareBracket
    );

    var close;

    if (scanner.token.type === TokenType.LeftParenthesis) {
        close = TokenType.RightParenthesis;
    } else {
        close = TokenType.RightSquareBracket;
    }

    var node = [
        getInfo(),
        NodeType.BracesType,
        scanner.token.value,
        null
    ];

    // left brace
    scanner.next();

    scan:
    while (scanner.token !== null) {
        switch (scanner.token.type) {
            case close:
                node[3] = scanner.token.value;
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
                node.push(getBraces(scope));
                break;

            case TokenType.Solidus:
            case TokenType.Asterisk:
            case TokenType.Comma:
            case TokenType.Colon:
                node.push(getOperator());
                break;

            default:
                node.push(getAny(scope));
        }
    }

    // right brace
    eat(close);

    return node;
}

// '.' ident
function getClass() {
    var info = getInfo();

    eat(TokenType.FullStop);

    return [
        info,
        NodeType.ClassType,
        getIdentifier()
    ];
}

// '#' ident
// FIXME: shash node should has structure like other ident's (['shash', ['ident', ident]])
function getShash() {
    var info = getInfo();

    eat(TokenType.NumberSign);

    return [
        info,
        NodeType.ShashType,
        readIdent()
    ];
}

// + | > | ~ | /deep/
function getCombinator() {
    var info = getInfo();
    var combinator;

    switch (scanner.token.type) {
        case TokenType.PlusSign:
        case TokenType.GreaterThanSign:
        case TokenType.Tilde:
            combinator = scanner.token.value;
            scanner.next();
            break;

        case TokenType.Solidus:
            combinator = '/deep/';
            scanner.next();

            expectIdentifier('deep', true);

            eat(TokenType.Solidus);
            break;

        default:
            parseError('Combinator (+, >, ~, /deep/) is expected');
    }

    return [
        info,
        NodeType.CombinatorType,
        combinator
    ];
}

// '/*' .* '*/'
function getComment() {
    var info = getInfo();
    var value = scanner.token.value;
    var len = value.length;

    if (len > 4 && value.charAt(len - 2) === '*' && value.charAt(len - 1) === '/') {
        len -= 2;
    }

    scanner.next();

    return [
        info,
        NodeType.CommentType,
        value.substring(2, len)
    ];
}

// special reader for units to avoid adjoined IE hacks (i.e. '1px\9')
function readUnit() {
    if (scanner.token !== null && scanner.token.type === TokenType.Identifier) {
        var unit = scanner.token.value;
        var backSlashPos = unit.indexOf('\\');

        // no backslash in unit name
        if (backSlashPos === -1) {
            scanner.next();
            return unit;
        }

        // patch token
        scanner.token.value = unit.substr(backSlashPos);
        scanner.token.offset += backSlashPos;
        scanner.token.column += backSlashPos;

        // return unit w/o backslash part
        return unit.substr(0, backSlashPos);
    }

    parseError('Identifier is expected');
}

// number ident
function getDimension(number) {
    return [
        number ? number[0] : getInfo(),
        NodeType.DimensionType,
        number || getNumber(),
        [
            getInfo(),
            NodeType.IdentType,
            readUnit()
        ]
    ];
}

// ident '(' functionBody ')' |
// not '(' <simpleSelector>* ')'
function getFunction(scope, ident) {
    var defaultBody = getFunctionBody;

    if (!ident) {
        ident = getIdentifier();
    }

    // parse special functions
    var name = ident[2].toLowerCase();

    if (specialFunctions.hasOwnProperty(scope)) {
        if (specialFunctions[scope].hasOwnProperty(name)) {
            return specialFunctions[scope][name](scope, ident);
        }
    }

    return getFunctionInternal(defaultBody, scope, ident);
}

function getNotFunction(scope, ident) {
    return getFunctionInternal(getNotFunctionBody, scope, ident);
}

function getVarFunction(scope, ident) {
    return getFunctionInternal(getVarFunctionBody, scope, ident);
}

function getFunctionInternal(functionBodyReader, scope, ident) {
    var info = ident[0];
    var body;

    eat(TokenType.LeftParenthesis);
    body = functionBodyReader(scope);
    eat(TokenType.RightParenthesis);

    return [
        info,
        NodeType.FunctionType,
        ident,
        body
    ];
}

function getFunctionBody(scope) {
    var node = [getInfo(), NodeType.FunctionBodyType];

    scan:
    while (scanner.token !== null) {
        switch (scanner.token.type) {
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
                node.push(getBraces(scope));
                break;

            case TokenType.Solidus:
            case TokenType.Asterisk:
            case TokenType.Comma:
            case TokenType.Colon:
            case TokenType.EqualsSign:
                node.push(getOperator());
                break;

            default:
                node.push(getAny(scope));
        }
    }

    return node;
}

function getNotFunctionBody() {
    var node = [getInfo(), NodeType.FunctionBodyType];
    var wasSelector = false;

    scan:
    while (scanner.token !== null) {
        switch (scanner.token.type) {
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
                    getInfo(),
                    NodeType.DelimType
                ]);
                scanner.next();
                break;

            default:
                wasSelector = true;
                node.push(getSimpleSelector(true));
        }
    }

    return node;
}

// var '(' ident (',' <declaration-value>)? ')'
function getVarFunctionBody() {
    var node = [getInfo(), NodeType.FunctionBodyType];

    readSC(node);
    node.push(getIdentifier(true));
    readSC(node);

    if (scanner.token !== null && scanner.token.type === TokenType.Comma) {
        node.push(
            getOperator(),
            getValue(true)
        );
        readSC(node);
    }

    return node;
}

// url '(' ws* (string | raw) ws* ')'
function getUri(scope, ident) {
    if (!ident) {
        ident = getIdentifier();
    }

    var node = [ident[0], NodeType.UriType];

    if (ident[2].toLowerCase() !== 'url') {
        pos--;
        parseError('`url` is expected');
    }

    eat(TokenType.LeftParenthesis); // (

    readSC(node);

    if (scanner.token.type === TokenType.String) {
        node.push(getString());
        readSC(node);
    } else {
        var rawInfo = getInfo();
        var raw = '';

        for (; scanner.token !== null; scanner.next()) {
            var type = scanner.token.type;

            if (type === TokenType.Space ||
                type === TokenType.LeftParenthesis ||
                type === TokenType.RightParenthesis) {
                break;
            }

            raw += scanner.token.value;
        }

        node.push([
            rawInfo,
            NodeType.RawType,
            raw
        ]);

        readSC(node);
    }

    eat(TokenType.RightParenthesis); // )

    return node;
}

// expression '(' raw ')'
function getOldIEExpression(scope, ident) {
    if (!ident) {
        ident = getIdentifier();
    }

    var info = ident[0];
    var balance = 0;
    var raw = '';

    if (ident[2].toLowerCase() !== 'expression') {
        parseError('`expression` is expected');
    }

    eat(TokenType.LeftParenthesis);

    for (; scanner.token !== null; scanner.next()) {
        if (scanner.token.type === TokenType.RightParenthesis) {
            if (balance === 0) {
                break;
            }

            balance--;
        } else if (scanner.token.type === TokenType.LeftParenthesis) {
            balance++;
        }

        raw += scanner.token.value;
    }

    eat(TokenType.RightParenthesis);

    return [
        info,
        NodeType.FunctionExpressionType,
        raw
    ];
}

function getUnicodeRange(tryNext) {
    var hex = '';

    for (; scanner.token !== null; scanner.next()) {
        if (scanner.token.type !== TokenType.DecimalNumber &&
            scanner.token.type !== TokenType.Identifier) {
            break;
        }

        hex += scanner.token.value;
    }

    if (!/^[0-9a-f]{1,6}$/i.test(hex)) {
        parseError('Unexpected input');
    }

    // U+abc???
    if (tryNext) {
        for (; hex.length < 6 && scanner.token !== null; scanner.next()) {
            if (scanner.token.type !== TokenType.QuestionMark) {
                break;
            }

            hex += scanner.token.value;
            tryNext = false;
        }
    }

    // U+aaa-bbb
    if (tryNext) {
        if (scanner.token !== null && scanner.token.type === TokenType.HyphenMinus) {
            scanner.next();

            var next = getUnicodeRange(false);

            if (!next) {
                parseError('Unexpected input');
            }

            hex += '-' + next;
        }
    }

    return hex;
}

function readIdent(varAllowed) {
    var name = '';

    // optional first -
    if (scanner.token !== null && scanner.token.type === TokenType.HyphenMinus) {
        name = '-';
        scanner.next();

        if (varAllowed && scanner.token !== null && scanner.token.type === TokenType.HyphenMinus) {
            name = '--';
            scanner.next();
        }
    }

    expectAny('Identifier',
        TokenType.LowLine,
        TokenType.Identifier
    );

    if (scanner.token !== null) {
        name += scanner.token.value;
        scanner.next();

        for (; scanner.token !== null; scanner.next()) {
            var type = scanner.token.type;

            if (type !== TokenType.LowLine &&
                type !== TokenType.Identifier &&
                type !== TokenType.DecimalNumber &&
                type !== TokenType.HyphenMinus) {
                break;
            }

            name += scanner.token.value;
        }
    }

    return name;
}

function getNamespacedIdentifier(checkColon) {
    if (scanner.token === null) {
        parseError('Unexpected end of input');
    }

    var info = getInfo();
    var name;

    if (scanner.token.type === TokenType.Asterisk) {
        checkColon = false;
        name = '*';
        scanner.next();
    } else {
        name = readIdent();
    }

    if (scanner.token !== null) {
        if (scanner.token.type === TokenType.VerticalLine &&
            scanner.lookupType(1, TokenType.EqualsSign) === false) {
            name += '|';

            if (scanner.next() !== null) {
                if (scanner.token.type === TokenType.HyphenMinus ||
                    scanner.token.type === TokenType.Identifier ||
                    scanner.token.type === TokenType.LowLine) {
                    name += readIdent();
                } else if (scanner.token.type === TokenType.Asterisk) {
                    checkColon = false;
                    name += '*';
                    scanner.next();
                }
            }
        }
    }

    if (checkColon && scanner.token !== null && scanner.token.type === TokenType.Colon) {
        scanner.next();
        name += ':' + readIdent();
    }

    return [
        info,
        NodeType.IdentType,
        name
    ];
}

function getIdentifier(varAllowed) {
    return [
        getInfo(),
        NodeType.IdentType,
        readIdent(varAllowed)
    ];
}

// ! ws* important
function getImportant() {
    var info = getInfo();
    var node;

    eat(TokenType.ExclamationMark);

    node = readSC([
        info,
        NodeType.ImportantType
    ]);

    expectIdentifier('important', true);

    return node;
}

// odd | even | number? n
function getNth() {
    expectAny('Number, odd or even',
        TokenType.Identifier,
        TokenType.DecimalNumber
    );

    var info = getInfo();
    var value = scanner.token.value;
    var cmpValue;

    if (scanner.token.type === TokenType.DecimalNumber) {
        var next = scanner.lookup(1);
        if (next !== null &&
            next.type === TokenType.Identifier &&
            next.value.toLowerCase() === 'n') {
            value += next.value;
            scanner.next();
        }
    } else {
        var cmpValue = value.toLowerCase();
        if (cmpValue !== 'odd' && cmpValue !== 'even' && cmpValue !== 'n') {
            parseError('Unexpected identifier');
        }
    }

    scanner.next();

    return [
        info,
        NodeType.NthType,
        value
    ];
}

function getNthSelector() {
    var info = getInfo();
    var node;

    eat(TokenType.Colon);
    expectIdentifier('nth', false);

    node = [
        info,
        NodeType.NthselectorType,
        getIdentifier()
    ];

    eat(TokenType.LeftParenthesis);

    scan:
    while (scanner.token !== null) {
        switch (scanner.token.type) {
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
    var info = getInfo();
    var wasDigits = false;
    var number = '';
    var offset = 0;

    if (scanner.lookupType(offset, TokenType.HyphenMinus)) {
        number = '-';
        offset++;
    }

    if (scanner.lookupType(offset, TokenType.DecimalNumber)) {
        wasDigits = true;
        number += scanner.lookup(offset).value;
        offset++;
    }

    if (scanner.lookupType(offset, TokenType.FullStop)) {
        number += '.';
        offset++;
    }

    if (scanner.lookupType(offset, TokenType.DecimalNumber)) {
        wasDigits = true;
        number += scanner.lookup(offset).value;
        offset++;
    }

    if (wasDigits) {
        while (offset--) {
            scanner.next();
        }

        return [
            info,
            NodeType.NumberType,
            number
        ];
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

    var info = getInfo();
    var value = scanner.token.value;

    scanner.next();

    return [
        info,
        NodeType.OperatorType,
        value
    ];
}

// node: Percentage
function tryGetPercentage() {
    var number = tryGetNumber();

    if (number && scanner.token !== null && scanner.token.type === TokenType.PercentSign) {
        return getPercentage(number);
    }

    return null;
}

function getPercentage(number) {
    var info;

    if (!number) {
        info = getInfo();
        number = getNumber();
    } else {
        info = number[0];
    }

    eat(TokenType.PercentSign);

    return [
        info,
        NodeType.PercentageType,
        number
    ];
}

function getFilterValue() {
    var progid;
    var node = [
        getInfo(),
        NodeType.FiltervType
    ];

    while (progid = checkProgid()) {
        node.push(getProgid(progid));
    }

    readSC(node);

    if (scanner.token !== null && scanner.token.type === TokenType.ExclamationMark) {
        node.push(getImportant());
    }

    return node;
}

// 'progid:' ws* 'DXImageTransform.Microsoft.' ident ws* '(' .* ')'
function checkProgid() {
    function checkSC(offset) {
        for (var cursor; cursor = scanner.lookup(offset); offset++) {
            if (cursor.type !== TokenType.Space &&
                cursor.type !== TokenType.Comment) {
                break;
            }
        }

        return offset;
    }

    var offset = checkSC(0);

    if (scanner.lookup(offset + 1) === null ||
        scanner.lookup(offset + 0).value.toLowerCase() !== 'progid' ||
        scanner.lookup(offset + 1).type !== TokenType.Colon) {
        return false; // fail
    }

    offset += 2;
    offset = checkSC(offset);

    if (scanner.lookup(offset + 5) === null ||
        scanner.lookup(offset + 0).value.toLowerCase() !== 'dximagetransform' ||
        scanner.lookup(offset + 1).type !== TokenType.FullStop ||
        scanner.lookup(offset + 2).value.toLowerCase() !== 'microsoft' ||
        scanner.lookup(offset + 3).type !== TokenType.FullStop ||
        scanner.lookup(offset + 4).type !== TokenType.Identifier) {
        return false; // fail
    }

    offset += 5;
    offset = checkSC(offset);

    if (scanner.lookupType(offset, TokenType.LeftParenthesis) === false) {
        return false; // fail
    }

    for (var cursor; cursor = scanner.lookup(offset); offset++) {
        if (cursor.type === TokenType.RightParenthesis) {
            return cursor;
        }
    }

    return false;
}

function getProgid(progidEnd) {
    var node = [getInfo(), NodeType.ProgidType];
    var value = '';

    if (!progidEnd) {
        progidEnd = checkProgid();
    }

    if (!progidEnd) {
        parseError('progid is expected');
    }

    readSC(node);

    var rawInfo = getInfo();
    for (; scanner.token && scanner.token !== progidEnd; scanner.next()) {
        value += scanner.token.value;
    }

    eat(TokenType.RightParenthesis);
    value += ')';

    node.push([
        rawInfo,
        NodeType.RawType,
        value
    ]);

    readSC(node);

    return node;
}

// <pseudo-element> | <nth-selector> | <pseudo-class>
function getPseudo() {
    if (scanner.type === null || scanner.token.type !== TokenType.Colon) {
        parseError('Colon is expected');
    }

    var next = scanner.lookup(1);

    if (next === null) {
        scanner.next();
        parseError('Colon or identifier is expected');
    }

    if (next.type === TokenType.Colon) {
        return getPseudoElement();
    }

    if (next.type === TokenType.Identifier &&
        next.value.toLowerCase() === 'nth') {
        return getNthSelector();
    }

    return getPseudoClass();
}

// :: ident
function getPseudoElement() {
    var info = getInfo();

    eat(TokenType.Colon);
    eat(TokenType.Colon);

    return [info, NodeType.PseudoeType, getIdentifier()];
}

// : ( ident | function )
function getPseudoClass() {
    var info = getInfo();
    var node = eat(TokenType.Colon) && getIdentifier();

    if (scanner.token !== null && scanner.token.type === TokenType.LeftParenthesis) {
        node = getFunction(SCOPE_SELECTOR, node);
    }

    return [
        info,
        NodeType.PseudocType,
        node
    ];
}

// ws
function getS() {
    var info = getInfo();
    var value = scanner.token.value;

    scanner.next();

    return [
        info,
        NodeType.SType,
        value
    ];
}

function readSC(node) {
    scan:
    while (scanner.token !== null) {
        switch (scanner.token.type) {
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
    var info = getInfo();
    var value = scanner.token.value;

    scanner.next();

    return [
        info,
        NodeType.StringType,
        value
    ];
}

// '+' | '-'
function getUnary() {
    expectAny('Unary operator',
        TokenType.HyphenMinus,
        TokenType.PlusSign
    );

    var info = getInfo();
    var value = scanner.token.value;

    scanner.next();

    return [
        info,
        NodeType.UnaryType,
        value
    ];
}

// '//' ...
// TODO: remove it as wrong thing
function getUnknown() {
    var info = getInfo();
    var value = scanner.token.value;

    eat(TokenType.Unknown);

    return [
        info,
        NodeType.UnknownType,
        value
    ];
}

// # ident
function getVhash() {
    eat(TokenType.NumberSign);

    expectAny('Number or identifier',
        TokenType.DecimalNumber,
        TokenType.Identifier
    );

    var info = getInfo();
    var name = scanner.token.value;

    if (scanner.token.type === TokenType.DecimalNumber &&
        scanner.lookupType(1, TokenType.Identifier)) {
        scanner.next();
        name += scanner.token.value;
    }

    scanner.next();

    return [
        info,
        NodeType.VhashType,
        name
    ];
}

module.exports = function parse(source, context, options) {
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
    context = context || 'stylesheet';
    pos = 0;

    scanner = new Scanner(source, blockMode.hasOwnProperty(context), options.line, options.column);
    scanner.next();
    // tokens = scanner.tokenize();

    if (scanner.token) {
        ast = rules[context]();
    }

    scanner = null;

    if (!ast) {
        switch (context) {
            case 'stylesheet':
                ast = [{}, context];
                break;
            // case 'declarations':
            //     ast = [{}, 'block'];
            //     break;
        }
    }

    if (ast && !options.needInfo) {
        ast = cleanInfo(ast);
    }

    // console.log(require('../utils/stringify.js')(require('../utils/cleanInfo.js')(ast), true));
    return ast;
};
