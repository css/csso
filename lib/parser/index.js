'use strict';

var TokenType = require('./const.js').TokenType;
var NodeType = require('./const.js').NodeType;
var tokenize = require('./tokenize.js');
var cleanInfo = require('../utils/cleanInfo.js');
var tokens;
var pos;

var CSSPRules = {
    'atkeyword': function() { if (checkAtkeyword(pos)) return getAtkeyword(); },
    'atruleb': function() { if (checkAtruleb(pos)) return getAtruleb(); },
    'atruler': function() { if (checkAtruler(pos)) return getAtruler(); },
    'atrulerq': function() { if (checkAtrulerq(pos)) return getAtrulerq(); },
    'atrulers': function() { if (checkAtrulers(pos)) return getAtrulers(); },
    'atrules': function() { if (checkAtrules(pos)) return getAtrules(); },
    'attrib': function() { if (checkAttrib(pos)) return getAttrib(); },
    'attrselector': function() { if (checkAttrselector(pos)) return getAttrselector(); },
    'block': function() { if (checkBlock(pos)) return getBlock(); },
    'braces': function() { if (checkBraces(pos)) return getBraces(); },
    'clazz': function() { if (checkClazz(pos)) return getClazz(); },
    'combinator': function() { if (checkCombinator(pos)) return getCombinator(); },
    'comment': function() { if (checkComment(pos)) return getComment(); },
    'declaration': function() { if (checkDeclaration(pos)) return getDeclaration(); },
    'decldelim': function() { if (checkDecldelim(pos)) return getDecldelim(); },
    'delim': function() { if (checkDelim(pos)) return getDelim(); },
    'dimension': function() { if (checkDimension(pos)) return getDimension(); },
    'filter': function() {
        if (checkDeclaration(pos) && tokens[pos].filter) {
            return getFilter();
        }
    },
    'functionExpression': function() { if (checkFunctionExpression(pos)) return getFunctionExpression(); },
    'funktion': function() { if (checkFunktion(pos)) return getFunktion(); },
    'ident': function() { if (checkIdent(pos)) return getIdent(); },
    'important': function() { if (checkImportant(pos)) return getImportant(); },
    'nth': function() { if (checkNth(pos)) return getNth(); },
    'nthselector': function() { if (checkNthselector(pos)) return getNthselector(); },
    'number': function() { if (checkNumber(pos)) return getNumber(); },
    'operator': function() { if (checkOperator(pos)) return getOperator(); },
    'percentage': function() { if (checkPercentage(pos)) return getPercentage(); },
    'progid': function() { if (checkProgid(pos)) return getProgid(); },
    'property': function() { if (checkProperty(pos)) return getProperty(); },
    'pseudoc': function() { if (checkPseudoc(pos)) return getPseudoc(); },
    'pseudoe': function() { if (checkPseudoe(pos)) return getPseudoe(); },
    'ruleset': function() { if (checkRuleset(pos)) return getRuleset(); },
    's': function() { if (checkS(pos)) return getS(); },
    'selector': function() { if (checkSelector(pos)) return getSelector(); },
    'shash': function() { if (checkShash(pos)) return getShash(); },
    'simpleselector': function() { if (checkSimpleselector(pos)) return getSimpleSelector(); },
    'string': function() { if (checkString(pos)) return getString(); },
    'stylesheet': function() {
        return getStylesheet();
    },
    'unary': function() { if (checkUnary(pos)) return getUnary(); },
    'unknown': function() { if (checkUnknown(pos)) return getUnknown(); },
    'uri': function() { if (checkUri(pos)) return getUri(); },
    'value': function() { if (checkValue(pos)) return getValue(); },
    'vhash': function() { if (checkVhash(pos)) return getVhash(); }
};

function throwError() {
    throw new Error('Please check the validity of the CSS block starting from the line #' + tokens[pos].line);
}

function getInfo(idx) {
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

//any = braces | string | percentage | dimension | number | uri | functionExpression | funktion | ident | unary
function checkAny(_i) {
    var getter;
    var len;

    if (len = checkBraces(_i)) getter = getBraces;
    else if (len = checkString(_i)) getter = getString;
    else if (len = checkPercentage(_i)) getter = getPercentage;
    else if (len = checkDimension(_i)) getter = getDimension;
    else if (len = checkNumber(_i)) getter = getNumber;
    else if (len = checkUri(_i)) getter = getUri;
    else if (len = checkFunctionExpression(_i)) getter = getFunctionExpression;
    else if (len = checkFunktion(_i)) getter = getFunktion;
    else if (len = checkIdent(_i)) getter = getIdent;
    else if (len = checkUnary(_i)) getter = getUnary;

    if (getter) {
        tokens[_i].get = getter;
        return len;
    }
}

function getAny() {
    return tokens[pos].get();
}

//atkeyword = '@' ident:x -> [#atkeyword, x]
function checkAtkeyword(_i) {
    var len;

    if (tokens[_i++].type === TokenType.CommercialAt) {
        if (len = checkIdent(_i)) {
            return len + 1;
        }
    }
}

function getAtkeyword() {
    return [getInfo(pos++), NodeType.AtkeywordType, getIdent()];
}

//attrib = '[' sc*:s0 ident:x sc*:s1 attrselector:a sc*:s2 (ident | string):y sc*:s3 ']' -> this.concat([#attrib], s0, [x], s1, [a], s2, [y], s3)
//       | '[' sc*:s0 ident:x sc*:s1 ']' -> this.concat([#attrib], s0, [x], s1),
function checkAttrib(_i) {
    if (tokens[_i].type !== TokenType.LeftSquareBracket || !tokens[_i].right) {
        return;
    }

    return tokens[_i].right - _i + 1;
}

function checkAttrib1(_i) {
    var start = _i;
    var l;

    _i++;

    _i += checkSC(_i); // s0

    if (l = checkIdent(_i, true)) {
        _i += l; // x
    } else {
        return;  // fail
    }

    if (tokens[_i].type === TokenType.VerticalLine &&
        tokens[_i + 1].type !== TokenType.EqualsSign) {
        _i++;

        if (l = checkIdent(_i, true)) {
            _i += l; // x
        } else {
            return; // fail
        }
    }

    _i += checkSC(_i); // s1

    if (l = checkAttrselector(_i)) {
        _i += l; // a
    } else {
        return;  // fail
    }

    _i += checkSC(_i); // s2

    if (l = (checkIdent(_i) || checkString(_i))) {
        _i += l; // y
    } else {
        return;  // fail
    }

    _i += checkSC(_i); // s3

    if (tokens[_i].type === TokenType.RightSquareBracket) {
        return _i - start;
    }
}

function getAttrib1() {
    var startPos = pos;

    pos++;

    var node = [getInfo(startPos), NodeType.AttribType];
    readSC(node);
    node.push(getIdent());

    if (tokens[pos].type === TokenType.VerticalLine &&
        tokens[pos + 1].type !== TokenType.EqualsSign) {
        node.push(
            getNamespace(),
            getIdent()
        );
    }
    
    readSC(node);
    node.push(getAttrselector());
    readSC(node);
    node.push(checkString(pos) ? getString() : getIdent());
    readSC(node);

    pos++;  // closing brace

    return node;
}

function checkAttrib2(_i) {
    var start = _i;
    var l;

    _i++;

    _i += checkSC(_i);

    if (l = checkIdent(_i, true)) {
        _i += l;
    }

    if (tokens[_i].type === TokenType.VerticalLine &&
        tokens[_i + 1].type !== TokenType.EqualsSign) {
        _i++;
        if (l = checkIdent(_i, true)) {
            _i += l; // x
        } else {
            return;  // fail
        }
    }

    _i += checkSC(_i);

    if (tokens[_i].type === TokenType.RightSquareBracket) {
        return _i - start;
    }
}

function getAttrib2() {
    var startPos = pos;

    pos++;

    var node = [getInfo(startPos), NodeType.AttribType];
    readSC(node);
    node.push(getIdent());

    if (tokens[pos].type === TokenType.VerticalLine &&
        tokens[pos + 1].type !== TokenType.EqualsSign) {
        node.push(
            getNamespace(),
            getIdent()
        );
    }

    readSC(node);

    pos++;

    return node;
}

function getAttrib() {
    if (checkAttrib1(pos)) return getAttrib1();
    if (checkAttrib2(pos)) return getAttrib2();
}

function checkAttrselector(_i) {
    switch (tokens[_i].type) {
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
    var startPos = pos;
    var s = tokens[pos++].value;

    if (pos < tokens.length && tokens[pos].type === TokenType.EqualsSign) {
        s += tokens[pos++].value;
    }

    return [getInfo(startPos), NodeType.AttrselectorType, s];
}

//atrule = atruler | atruleb | atrules
function checkAtrule(_i) {
    var getter;
    var len;

    if (len = checkAtruler(_i)) getter = getAtruler;
    else if (len = checkAtruleb(_i)) getter = getAtruleb;
    else if (len = checkAtrules(_i)) getter = getAtrules;
    else return;

    tokens[_i].atrule_type = getter;
    return len;
}

function getAtrule() {
    return tokens[pos].atrule_type();
}

//atruleb = atkeyword:ak tset*:ap block:b -> this.concat([#atruleb, ak], ap, [b])
function checkAtruleb(_i) {
    var start = _i;
    var l;

    if (l = checkAtkeyword(_i)) _i += l;
    else return; // fail

    if (l = checkTsets(_i)) _i += l;

    if (l = checkBlock(_i)) _i += l;
    else return; // fail

    return _i - start;
}

function getAtruleb() {
    return [getInfo(pos), NodeType.AtrulebType, getAtkeyword()].concat(
        getTsets(),
        [getBlock()]
    );
}

//atruler = atkeyword:ak atrulerq:x '{' atrulers:y '}' -> [#atruler, ak, x, y]
function checkAtruler(_i) {
    var start = _i;
    var l;

    if (l = checkAtkeyword(_i)) _i += l;
    else return; // fail

    if (l = checkAtrulerq(_i)) _i += l;

    if (_i < tokens.length && tokens[_i].type === TokenType.LeftCurlyBracket) _i++;
    else return; // fail

    if (l = checkAtrulers(_i)) _i += l;

    if (_i < tokens.length && tokens[_i].type === TokenType.RightCurlyBracket) _i++;
    else return; // fail

    return _i - start;
}

function getAtruler() {
    var atruler = [
        getInfo(pos),
        NodeType.AtrulerType,
        getAtkeyword(),
        getAtrulerq(),
        pos++ && getAtrulers() // pos++ for {
    ];

    pos++; // }

    return atruler;
}

//atrulerq = tset*:ap -> [#atrulerq].concat(ap)
function checkAtrulerq(_i) {
    return checkTsets(_i);
}

function getAtrulerq() {
    return createToken(NodeType.AtrulerqType).concat(getTsets());
}

//atrulers = sc*:s0 ruleset*:r sc*:s1 -> this.concat([#atrulers], s0, r, s1)
function checkAtrulers(_i) {
    var start = _i;
    var len;

    while (_i < tokens.length) {
        if (len = (checkS(_i) || checkComment(_i) || checkRuleset(_i) || checkAtrule(_i))) {
            _i += len;
        } else {
            break;
        }
    }

    tokens[start].atrulers_end = _i;

    return _i - start;
}

function getAtrulers() {
    var atrulers = createToken(NodeType.AtrulersType);
    var end = tokens[pos].atrulers_end;
    var getter;

    while (pos < end) {
        if (checkS(pos)) {
            getter = getS;
        } else if (checkComment(pos)) {
            getter = getComment;
        } else if (checkRuleset(pos)) {
            getter = getRuleset;
        } else {
            getter = getAtrule;
        }

        atrulers.push(getter());
    }

    return atrulers;
}

//atrules = atkeyword:ak tset*:ap ';' -> this.concat([#atrules, ak], ap)
function checkAtrules(_i) {
    var start = _i;
    var l;

    if (l = checkAtkeyword(_i)) _i += l;
    else return; // fail

    if (l = checkTsets(_i)) _i += l;

    if (_i >= tokens.length) return _i - start;

    if (tokens[_i].type === TokenType.Semicolon) _i++;
    else return; // fail

    return _i - start;
}

function getAtrules() {
    var node = [getInfo(pos), NodeType.AtrulesType, getAtkeyword()].concat(getTsets());

    pos++;

    return node;
}

//block = '{' blockdecl*:x '}' -> this.concatContent([#block], x)
function checkBlock(_i) {
    if (_i < tokens.length && tokens[_i].type === TokenType.LeftCurlyBracket) {
        return tokens[_i].right - _i + 1;
    }
}

function getBlock() {
    var block = createToken(NodeType.BlockType);
    var end = tokens[pos].right;

    pos++;

    while (pos < end) {
        if (checkDeclaration(pos)) {
            block.push(getDeclaration());
            if (pos < end && tokens[pos].type === TokenType.Semicolon) {
                block.push(getDecldelim());
            }
        } else if (tokens[pos].type === TokenType.Semicolon) {
            block.push(getDecldelim());
        } else if (checkS(pos)) {
            block.push(getS());
        } else if (checkComment(pos)) {
            block.push(getComment());
        } else throwError();
    }

    pos = end + 1;

    return block;
}

//braces = '(' tset*:x ')' -> this.concat([#braces, '(', ')'], x)
//       | '[' tset*:x ']' -> this.concat([#braces, '[', ']'], x)
function checkBraces(_i) {
    if (_i < tokens.length) {
        if (tokens[_i].type === TokenType.LeftParenthesis ||
            tokens[_i].type === TokenType.LeftSquareBracket) {
            return tokens[_i].right - _i + 1;
        }
    }
}

function getBraces() {
    var left = pos;
    var right = tokens[pos].right;

    pos++; // left brace

    var tsets = checkTsets(pos) ? getTsets() : [];

    pos++; // right brace

    return [getInfo(left), NodeType.BracesType, tokens[left].value, tokens[right].value].concat(tsets);
}

// node: Clazz
function checkClazz(_i) {
    var token = tokens[_i];
    var len;

    if (token.clazz_l) {
        return token.clazz_l;
    }

    if (token.type === TokenType.FullStop && ++_i < tokens.length) {
        // otherwise it's converts to dimension and some part of selector lost (issue 99)
        if (tokens[_i].type === TokenType.DecimalNumber) {
            _i++;
        }

        if (len = checkIdent(_i)) {
            token.clazz_l = len + 1;
            return len + 1;
        }
    }
}

function getClazz() {
    var startPos = pos;
    pos += tokens[startPos].clazz_l;

    return [
        getInfo(startPos),
        NodeType.ClazzType,
        [
            getInfo(startPos + 1),
            NodeType.IdentType,
            joinValues(startPos + 1, pos - 1)
        ]
    ];
}

// node: Combinator
function checkCombinator(_i) {
    var type = tokens[_i].type;

    if (type === TokenType.PlusSign ||
        type === TokenType.GreaterThanSign ||
        type === TokenType.Tilde) {
        return 1;
    }

    if (type === TokenType.Solidus &&
        tokens[_i + 1].type === TokenType.Identifier && tokens[_i + 1].value === 'deep' &&
        tokens[_i + 2].type === TokenType.Solidus) {
        return 3;
    }
}

function getCombinator() {
    var info = getInfo(pos);
    var combinator;

    if (tokens[pos].type === TokenType.Solidus) {
        combinator = '/deep/';
        pos += 3;
    } else {
        combinator = tokens[pos].value;
        pos += 1;
    }

    return [info, NodeType.CombinatorType, combinator];
}

// node: Comment
function checkComment(_i) {
    if (tokens[_i].type === TokenType.CommentML) {
        return 1;
    }
}

function getComment() {
    var value = tokens[pos].value;
    var len = value.length;

    if (len > 4 && value.charAt(len - 2) === '*' && value.charAt(len - 1) === '/') {
        len -= 2;
    }

    return [getInfo(pos++), NodeType.CommentType, value.substring(2, len)];
}

// declaration = property:x ':' value:y -> [#declaration, x, y]
function checkDeclaration(_i) {
    var start = _i;
    var len;

    if (len = checkProperty(_i)) _i += len;
    else return; // fail

    if (_i < tokens.length && tokens[_i].type === TokenType.Colon) _i++;
    else return; // fail

    // check for filter
    for (var j = start; j < _i; j++) {
        if (tokens[j].value === 'filter') {
            if (len = checkFilterv(_i)) {
                tokens[start].filter = true;
                _i += len;
                return _i - start;
            }
            break;
        }
    }

    if (len = checkValue(_i)) _i += len;
    else return; // fail

    return _i - start;
}

function getDeclaration() {
    if (tokens[pos].filter) {
        return getFilter();
    }

    return [
        getInfo(pos),
        NodeType.DeclarationType,
        getProperty(),
        ++pos && getValue()  // ++pos to skip colon
    ];
}

function checkFilterv(_i) {
    var start = _i;
    var len;

    if (len = checkProgid(_i)) _i += len;
    else return; // fail

    while (len = checkProgid(_i)) {
        _i += len;
    }

    tokens[start].last_progid = _i;

    _i += checkSC(_i);

    if (_i < tokens.length) _i += checkImportant(_i);

    return _i - start;
}

function getFilterv() {
    var node = createToken(NodeType.FiltervType);
    var last_progid = tokens[pos].last_progid;

    while (pos < last_progid) {
        node.push(getProgid());
    }

    readSC(node);

    if (pos < tokens.length && checkImportant(pos)) {
        node.push(getImportant());
    }

    return node;
}

function getFilter() {
    return [
        getInfo(pos),
        NodeType.FilterType,
        getProperty(),
        ++pos && getFilterv() // pos++ for colon
    ];
}

// node: Decldelim
function checkDecldelim(_i) {
    if (_i < tokens.length && tokens[_i].type === TokenType.Semicolon) {
        return 1;
    }
}

function getDecldelim() {
    return [getInfo(pos++), NodeType.DecldelimType];
}

// node: Delim
function checkDelim(_i) {
    if (_i < tokens.length && tokens[_i].type === TokenType.Comma) {
        return 1;
    }
}

function getDelim() {
    return [getInfo(pos++), NodeType.DelimType];
}

// node: Dimension
function checkDimension(_i) {
    var ln = checkNumber(_i);
    var li;

    if (!ln || (ln && _i + ln >= tokens.length)) {
        return; // fail
    }

    if (li = checkNmName2(_i + ln)) {
        return ln + li;
    }
}

function getDimension() {
    return [
        getInfo(pos),
        NodeType.DimensionType,
        getNumber(),
        [
            getInfo(pos),
            NodeType.IdentType,
            getNmName2()
        ]
    ];
}

//functionExpression = ``expression('' functionExpressionBody*:x ')' -> [#functionExpression, x.join('')],
function checkFunctionExpression(_i) {
    var start = _i;

    if (!tokens[_i] || tokens[_i++].value !== 'expression') {
        return; // fail
    }

    if (!tokens[_i] || tokens[_i].type !== TokenType.LeftParenthesis) {
        return; // fail
    }

    return tokens[_i].right - start + 1;
}

function getFunctionExpression() {
    var startPos = pos;

    pos = tokens[pos].right + 1;

    return [
        getInfo(startPos),
        NodeType.FunctionExpressionType,
        joinValues(startPos + 2, tokens[startPos + 1].right - 1)
    ];
}

//funktion = ident:x '(' functionBody:y ')' -> [#funktion, x, y]
function checkFunktion(_i) {
    var start = _i;
    var len = checkIdent(_i);

    if (!len) {
        return; // fail
    }

    _i += len;

    if (_i < tokens.length && tokens[_i].type === TokenType.LeftParenthesis) {
        return tokens[_i].right - start + 1;
    }
}

function getFunktion() {
    var startPos = pos;
    var ident = getIdent();

    pos++;

    var body = ident[2] !== 'not'
        ? getFunctionBody()
        : getNotFunctionBody(); // ok, here we have CSS3 initial draft: http://dev.w3.org/csswg/selectors3/#negation

    return [getInfo(startPos), NodeType.FunktionType, ident, body];
}

function getFunctionBody() {
    var node = [getInfo(pos), NodeType.FunctionBodyType];

    while (tokens[pos].type !== TokenType.RightParenthesis) {
        if (checkTset(pos)) {
            node.push(getTset());
        } else {
            throwError();
        }
    }

    pos++;

    return node;
}

function getNotFunctionBody() {
    var node = [getInfo(pos), NodeType.FunctionBodyType];

    while (tokens[pos].type !== TokenType.RightParenthesis) {
        if (checkSimpleselector(pos)) {
            node.push(getSimpleSelector());
        } else {
            throwError();
        }
    }

    pos++;

    return node;
}

function getUnicodeRange(i, tryNext) {
    var hex = '';

    for (;i < tokens.length; i++) {
        if (tokens[i].type !== TokenType.DecimalNumber &&
            tokens[i].type !== TokenType.Identifier) {
            break;
        }

        hex += tokens[i].value
    }

    if (/^[0-9a-f]{1,6}$/i.test(hex)) {
        // U+abc???
        if (tryNext) {
            for (;hex.length < 6 && i < tokens.length; i++) {
                if (tokens[i].type !== TokenType.QuestionMark) {
                    break;
                }

                hex += tokens[i].value
                tryNext = false;
            }
        }

        // U+aaa-bbb
        if (tryNext) {
            if (tokens[i] && tokens[i].type === TokenType.HyphenMinus) {
                var next = getUnicodeRange(i + 1);
                if (next) {
                    return next;
                }
            }
        }

        return i;
    }
}

// node: Ident
function checkIdent(_i, attribute, hack) {
    if (_i >= tokens.length) {
        return; // fail
    }

    var start = _i;
    var type = tokens[_i].type;

    // unicode-range-token
    if (type === TokenType.Identifier &&
        (tokens[_i].value === 'U' || tokens[_i].value === 'u') &&
        tokens[_i + 1].type === TokenType.PlusSign) {
        var unicodeRange = getUnicodeRange(_i + 2, true);
        if (unicodeRange) {
            tokens[start].ident_last = unicodeRange - 1;
            return unicodeRange - start;
        }
    }

    // start char / word
    if (type !== TokenType.LowLine &&
        type !== TokenType.HyphenMinus &&
        type !== TokenType.Identifier &&
        type !== TokenType.DollarSign &&
        type !== TokenType.Asterisk) {
        return; // fail
    }

    _i++;

    if (type !== TokenType.Asterisk || hack) {
        for (; _i < tokens.length; _i++) {
            type = tokens[_i].type;
            if (type !== TokenType.HyphenMinus &&
                type !== TokenType.DecimalNumber &&
                type !== TokenType.LowLine &&
                type !== TokenType.Identifier &&
                (!attribute || type !== TokenType.Colon)) {
                break;
            }
        }
    }

    tokens[start].ident_last = _i - 1;
    return _i - start;
}

function getIdent() {
    var startPos = pos;

    pos = tokens[pos].ident_last + 1;

    return [getInfo(startPos), NodeType.IdentType, joinValues(startPos, pos - 1)];
}

//important = '!' sc*:s0 seq('important') -> [#important].concat(s0)
function checkImportant(_i) {
    var start = _i,
        l;

    if (tokens[_i].type !== TokenType.ExclamationMark) {
        return 0; // fail
    }

    _i += checkSC(_i + 1) + 1;

    if (tokens[_i].value.toLowerCase() !== 'important') {
        return 0; // fail
    }

    return _i - start + 1;
}

function getImportant() {
    var startPos = pos;

    pos++;

    var node = readSC([getInfo(startPos), NodeType.ImportantType]);

    pos++;

    return node;
}

// node: Namespace
function checkNamespace(_i) {
    if (tokens[_i].type === TokenType.VerticalLine) {
        return 1;
    }
}

function getNamespace() {
    return [getInfo(pos++), NodeType.NamespaceType];
}

//nth = (digit | 'n')+:x -> [#nth, x.join('')]
//    | (seq('even') | seq('odd')):x -> [#nth, x]
function checkNth(_i) {
    var start = _i;

    if (tokens[_i].value === 'even' || tokens[_i].value === 'odd') {
        return 1;
    }

    for (; _i < tokens.length; _i++) {
        if (tokens[_i].type !== TokenType.DecimalNumber && tokens[_i].value !== 'n') {
            break;
        }
    }

    if (_i !== start) {
        tokens[start].nth_last = _i - 1;
        return _i - start;
    }
}

function getNth() {
    var startPos = pos;

    if (tokens[pos].nth_last) {
        pos = tokens[pos].nth_last + 1;

        return [
            getInfo(startPos),
            NodeType.NthType,
            joinValues(startPos, tokens[startPos].nth_last)
        ];
    } else {
        pos++;
    }

    return [
        getInfo(startPos),
        NodeType.NthType,
        tokens[startPos].value
    ];
}

//nthf = ':' seq('nth-'):x (seq('child') | seq('last-child') | seq('of-type') | seq('last-of-type')):y -> (x + y)
function checkNthf(_i) {
    var start = _i;

    if (tokens[_i++].type !== TokenType.Colon) {
        return; // fail
    }

    if (tokens[_i++].value !== 'nth' || tokens[_i++].value !== '-') {
        return; // fail
    }

    var name = tokens[_i++].value;
    if (name !== 'child') {
        name += tokens[_i++].value + tokens[_i++].value;

        if (name !== 'last-child' && name !== 'of-type') {
            name += tokens[_i++].value + tokens[_i++].value;

            if (name !== 'last-of-type') {
                return; // fail
            }
        }
    }

    tokens[start].nthf_last = _i - 1;

    return _i - start;
}

function getNthf() {
    var s = joinValues(pos + 1, tokens[pos].nthf_last);

    pos = tokens[pos].nthf_last + 1;

    return s;
}

//nthselector = nthf:x '(' (sc | unary | nth)*:y ')' -> [#nthselector, [#ident, x]].concat(y)
function checkNthselector(_i) {
    var start = _i,
        l;

    if (l = checkNthf(_i)) _i += l;
    else return; // fail

    if (tokens[_i].type !== TokenType.LeftParenthesis || !tokens[_i].right) {
        return; // fail
    }

    l++;

    var end = tokens[_i++].right;

    while (_i < end) {
        if (l = checkSC(_i)) _i += l;
        else if (l = checkUnary(_i)) _i += l;
        else if (l = checkNth(_i)) _i += l;
        else return; // fail
    }

    return end - start + 1;
}

function getNthselector() {
    var nthf = [getInfo(pos), NodeType.IdentType, getNthf()];
    var node = [getInfo(pos), NodeType.NthselectorType, nthf];
    var end = tokens[pos].right;
    var getter;

    pos++;

    while (pos < end) {
        if (checkS(pos)) {
            getter = getS;
        } else if (checkComment(pos)) {
            getter = getComment;
        } else if (checkUnary(pos)) {
            getter = getUnary;
        } else {
            getter = getNth;
        }

        node.push(getter());
    }

    pos++;

    return node;
}

// node: Number
function checkNumber(_i, sign) {
    if (_i < tokens.length) {
        if (tokens[_i].number_l) {
            return tokens[_i].number_l;
        }

        if (!sign && tokens[_i].type === TokenType.HyphenMinus) {
            var len = checkNumber(_i + 1, true);
            if (len) {
                return tokens[_i].number_l = len + 1;
            } else {
                return; // fail
            }
        }
    }

    if (_i < tokens.length && tokens[_i].type === TokenType.DecimalNumber
    ) {
        if (tokens[_i + 1] && tokens[_i + 1].type === TokenType.FullStop) {
            if (tokens[_i + 2] && tokens[_i + 2].type === TokenType.DecimalNumber) {
                return tokens[_i].number_l = 3; // 10.10
            } else {
                return tokens[_i].number_l = 2; // 10.
            }
        } else {
            return tokens[_i].number_l = 1; // 10
        }
    }

    if (_i + 1 < tokens.length &&
        tokens[_i].type === TokenType.FullStop &&
        tokens[_i + 1].type === TokenType.DecimalNumber
    ) {
        return tokens[_i].number_l = 2; // .10
    }
}

function getNumber() {
    var s = '';
    var startPos = pos;
    var len = tokens[pos].number_l;

    for (var i = 0; i < len; i++) {
        s += tokens[pos++].value;
    }

    return [getInfo(startPos), NodeType.NumberType, s];
}

// node: Operator
function checkOperator(_i) {
    if (_i < tokens.length) {
        var type = tokens[_i].type;
        if (type === TokenType.Solidus ||
            type === TokenType.Comma ||
            type === TokenType.Colon ||
            type === TokenType.EqualsSign) {
            return 1;
        }
    }
}

function getOperator() {
    return [getInfo(pos), NodeType.OperatorType, tokens[pos++].value];
}

// node: Percentage
function checkPercentage(_i) {
    var x = checkNumber(_i);

    if (!x || (x && _i + x >= tokens.length)) {
        return; // fail
    }

    if (tokens[_i + x].type === TokenType.PercentSign) {
        return x + 1;
    }
}

function getPercentage() {
    var startPos = pos;
    var number = getNumber();

    pos++;

    return [getInfo(startPos), NodeType.PercentageType, number];
}

//progid = sc*:s0 seq('progid:DXImageTransform.Microsoft.'):x letter+:y '(' (m_string | m_comment | ~')' char)+:z ')' sc*:s1
//                -> this.concat([#progid], s0, [[#raw, x + y.join('') + '(' + z.join('') + ')']], s1),
function checkProgid(_i) {
    var start = _i,
        l,
        x;

    _i += checkSC(_i);

    if (_i < tokens.length - 1 && tokens[_i].value === 'progid' && tokens[_i + 1].type === TokenType.Colon) {
        _i += 2;
    } else return; // fail

    _i += checkSC(_i);

    if ((x = joinValues2(_i, 4)) === 'DXImageTransform.Microsoft.') {
        _i += 4;
    } else return; // fail

    if (l = checkIdent(_i)) _i += l;
    else return; // fail

    _i += checkSC(_i);

    if (tokens[_i].type === TokenType.LeftParenthesis) {
        tokens[start].progid_end = tokens[_i].right;
        _i = tokens[_i].right + 1;
    } else return; // fail

    _i += checkSC(_i);

    return _i - start;
}

function getProgid() {
    var startPos = pos;
    var node = [getInfo(startPos), NodeType.ProgidType]

    readSC(node);
    node.push(_getProgid(tokens[startPos].progid_end))
    readSC(node);

    return node;
}

function _getProgid(progid_end) {
    var startPos = pos;

    pos = progid_end + 1;

    return [getInfo(startPos), NodeType.RawType, joinValues(startPos, progid_end)];
}

//property = ident:x sc*:s0 -> this.concat([#property, x], s0)
function checkProperty(_i) {
    var start = _i,
        l;

    if (l = checkIdent(_i, false, true)) _i += l;
    else return; // fail

    _i += checkSC(_i);
    return _i - start;
}

function getProperty() {
    return readSC([getInfo(pos), NodeType.PropertyType, getIdent()]);
}

function checkPseudo(_i) {
    return checkPseudoe(_i) ||
           checkPseudoc(_i);
}

function getPseudo() {
    if (checkPseudoe(pos)) return getPseudoe();
    if (checkPseudoc(pos)) return getPseudoc();
}

function checkPseudoe(_i) {
    var len;

    if (tokens[_i++].type !== TokenType.Colon) {
        return;
    }

    if (tokens[_i++].type !== TokenType.Colon) {
        return;
    }

    if (len = checkIdent(_i)) {
        return len + 2;
    }
}

function getPseudoe() {
    var startPos = pos;

    pos += 2; // ::

    return [getInfo(startPos), NodeType.PseudoeType, getIdent()];
}

//pseudoc = ':' (funktion | ident):x -> [#pseudoc, x]
function checkPseudoc(_i) {
    var l;

    if (tokens[_i++].type !== TokenType.Colon) {
        return;
    }

    if (l = (checkFunktion(_i) || checkIdent(_i))) {
        return l + 1;
    }
}

function getPseudoc() {
    var startPos = pos;

    pos++;

    return [
        getInfo(startPos),
        NodeType.PseudocType,
        checkFunktion(pos) ? getFunktion() : getIdent()
    ];
}

//ruleset = selector*:x block:y -> this.concat([#ruleset], x, [y])
function checkRuleset(_i) {
    var start = _i;
    var len;

    if (len = checkSelector(_i)) {
        _i += len;
    }

    if (len = checkBlock(_i)) {
        _i += len;
    } else return; // fail

    return _i - start;
}

function getRuleset() {
    var ruleset = createToken(NodeType.RulesetType);
    var selectorEnd = tokens[pos].selector_end || 0;

    while (pos < selectorEnd) {
        ruleset.push(getSelector());
    }

    ruleset.push(getBlock());

    return ruleset;
}

// node: S
function checkS(_i) {
    if (tokens[_i].type === TokenType.Space) {
        return 1;
    }
}

function getS() {
    return [getInfo(pos), NodeType.SType, tokens[pos++].value];
}

function checkSC(_i) {
    var start = _i;
    var len;

    while (_i < tokens.length) {
        if (checkS(_i) || checkComment(_i)) {
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
    while (pos < tokens.length) {
        if (checkS(pos)) node.push(getS());
        else if (checkComment(pos)) node.push(getComment());
        else break;
    }

    return node;
}

//selector = (simpleselector | delim)+:x -> this.concat([#selector], x)
function checkSelector(_i) {
    var start = _i;
    var len;

    while (_i < tokens.length) {
        if (len = (checkSimpleselector(_i) || checkDelim(_i))) {
            _i += len;
        } else {
            break;
        }
    }

    if (_i !== start) {
        tokens[start].selector_end = _i;
        return _i - start;
    }
}

function getSelector() {
    var selector = createToken(NodeType.SelectorType);
    var selector_end = tokens[pos].selector_end;

    while (pos < selector_end) {
        if (tokens[pos].type === TokenType.Comma) {
            selector.push(getDelim());
        } else {
            selector.push(getSimpleSelector());
        }
    }

    return selector;
}

// node: Shash
function checkShash(_i) {
    if (tokens[_i].type !== TokenType.NumberSign) {
        return; // fail
    }

    var len;

    if (len = checkNmName(_i + 1)) {
        return len + 1;
    }
}

function getShash() {
    return [getInfo(pos++), NodeType.ShashType, getNmName()];
}

//simpleselector = (nthselector | combinator | attrib | pseudo | clazz | shash | any | sc | namespace)+:x -> this.concatContent([#simpleselector], [x])
function checkSimpleselector(_i) {
    var start = _i;
    var getter;
    var len;

    while (_i < tokens.length) {
        if (len = checkNthselector(_i)) getter = getNthselector;
        else if (len = checkCombinator(_i)) getter = getCombinator;
        else if (len = checkAttrib(_i)) getter = getAttrib;
        else if (len = checkPseudo(_i)) getter = getPseudo;
        else if (len = checkClazz(_i)) getter = getClazz;
        else if (len = checkShash(_i)) getter = getShash;
        else if (len = checkAny(_i)) getter = getAny;
        else if (len = checkS(_i)) getter = getS;
        else if (len = checkComment(_i)) getter = getComment;
        else if (len = checkNamespace(_i)) getter = getNamespace;

        if (len) {
            if (!tokens[_i].get) {
                tokens[_i].get = getter;
            }
            _i += len;
        } else {
            break;
        }
    }

    if (_i - start) {
        tokens[start].len = _i;
        return _i - start;
    }
}

function getSimpleSelector() {
    var node = createToken(NodeType.SimpleselectorType);
    var len = tokens[pos].len;

    while (pos < len) {
        node.push(tokens[pos].get());
    }

    return node;
}

// node: String
function checkString(_i) {
    if (_i < tokens.length) {
        var type = tokens[_i].type;
        if (type === TokenType.StringSQ ||
            type === TokenType.StringDQ) {
            return 1;
        }
    }
}

function getString() {
    return [getInfo(pos), NodeType.StringType, tokens[pos++].value];
}

function getStylesheet() {
    if (!tokens.length) {
        return;
    }

    var stylesheet = createToken(NodeType.StylesheetType);
    var getter;

    for (; pos < tokens.length;) {
        if (checkS(pos)) getter = getS;
        else if (checkComment(pos)) getter = getComment;
        else if (checkRuleset(pos)) getter = getRuleset;
        else if (checkAtrule(pos)) getter = getAtrule;
        else if (checkUnknown(pos)) getter = getUnknown;
        else throwError();

        stylesheet.push(getter());
    }

    return stylesheet;
}

//tset = vhash | any | sc | operator
function checkTset(_i) {
    var getter;
    var len;

    if (len = checkVhash(_i)) getter = getVhash;
    else if (len = checkAny(_i)) getter = getAny;
    else if (len = checkS(_i)) getter = getS;
    else if (len = checkComment(_i)) getter = getComment;
    else if (len = checkOperator(_i)) getter = getOperator;
    else return 0;

    tokens[_i].getTset = getter;
    return len;
}

function getTset() {
    return tokens[pos].getTset();
}

function checkTsets(_i) {
    var start = _i;
    var len;

    while (len = checkTset(_i)) {
        _i += len;
    }

    tokens[start].tsetLen = _i;
    return _i - start;
}

function getTsets() {
    var end = tokens[pos].tsetLen;
    var tsets = [];

    while (pos < end) {
        tsets.push(getTset());
    }

    return tsets;
}

// node: Unary
function checkUnary(_i) {
    if (_i < tokens.length) {
        var type = tokens[_i].type;
        if (type === TokenType.HyphenMinus ||
            type === TokenType.PlusSign) {
            return 1;
        }
    }
}

function getUnary() {
    return [getInfo(pos), NodeType.UnaryType, tokens[pos++].value];
}

// node: Unknown
function checkUnknown(_i) {
    if (_i < tokens.length && tokens[_i].type === TokenType.CommentSL) {
        return 1;
    }
}

function getUnknown() {
    return [getInfo(pos), NodeType.UnknownType, tokens[pos++].value];
}

//    uri = seq('url(') sc*:s0 string:x sc*:s1 ')' -> this.concat([#uri], s0, [x], s1)
//        | seq('url(') sc*:s0 (~')' ~m_w char)*:x sc*:s1 ')' -> this.concat([#uri], s0, [[#raw, x.join('')]], s1),
function checkUri(_i) {
    var start = _i;

    if (_i < tokens.length && tokens[_i].value !== 'url') {
        return; // fail
    }

    _i++;

    if (_i < tokens.length && tokens[_i].type === TokenType.LeftParenthesis) {
        return tokens[_i].right - start + 1;
    }
}

function getUri() {
    var startPos = pos;

    pos += 2; // url(

    if (checkUri1(pos)) {
        var uri = [getInfo(startPos), NodeType.UriType];
        readSC(uri);
        uri.push(getString())
        readSC(uri);
    } else {
        var uri = readSC([getInfo(startPos), NodeType.UriType]);
        var l = checkExcluding(pos);
        var raw = [getInfo(pos), NodeType.RawType, joinValues(pos, pos + l)];

        uri.push(raw);

        pos += l + 1;

        readSC(uri);
    }

    pos++;  // )

    return uri;
}

function checkUri1(_i) {
    var start = _i;
    var l;

    _i += checkSC(_i);

    if (tokens[_i].type !== TokenType.StringDQ &&
        tokens[_i].type !== TokenType.StringSQ) {
        return
    }

    _i++;

    _i += checkSC(_i);

    return _i - start;
}

// value = (sc | vhash | any | block | atkeyword | operator | important)+:x -> this.concat([#value], x)
function checkValue(_i) {
    var start = _i,
        getter,
        len;

    // if (checkProgid())

    while (_i < tokens.length) {
        if (len = checkS(_i)) getter = getS;
        else if (len = checkComment(_i)) getter = getComment;
        else if (len = checkVhash(_i)) getter = getVhash;
        else if (len = checkAny(_i)) getter = getAny;
        else if (len = checkOperator(_i)) getter = getOperator;
        else if (len = checkImportant(_i)) getter = getImportant;

        if (len) {
            if (!tokens[_i].get) {
                tokens[_i].get = getter;
            }
            _i += len;
        } else {
            break;
        }
    }

    if (_i !== start) {
        tokens[start].len = _i;
        return _i - start;
    }
}

function getValue() {
    var node = createToken(NodeType.ValueType);
    var len = tokens[pos].len;

    while (pos < len) {
        node.push(tokens[pos].get());
    }

    return node;
}

// node: Vhash
function checkVhash(_i) {
    if (_i < tokens.length && tokens[_i].type === TokenType.NumberSign) {
        var len = checkNmName2(_i + 1);

        if (len) {
            return len + 1;
        }
    }
}

function getVhash() {
    return [getInfo(pos++), NodeType.VhashType, getNmName2()];
}

function checkNmName(_i) {
    var start = _i;
    var type;

    // start char / word
    for (; _i < tokens.length; _i++) {
        type = tokens[_i].type;
        if (type !== TokenType.HyphenMinus &&
            type !== TokenType.LowLine &&
            type !== TokenType.Identifier &&
            type !== TokenType.DecimalNumber) break;
    }

    if (_i !== start) {
        tokens[start].nm_name_last = _i - 1;
        return _i - start;
    }
}

function getNmName() {
    var name = joinValues(pos, tokens[pos].nm_name_last);

    pos = tokens[pos].nm_name_last + 1;

    return name;
}

function checkNmName2(_i) {
    if (tokens[_i].type === TokenType.Identifier) {
        return 1;
    }

    if (tokens[_i].type === TokenType.DecimalNumber) {
        _i++;

        if (_i < tokens.length && tokens[_i].type === TokenType.Identifier) {
            return 2;
        }

        return 1;
    }
}

function getNmName2() {
    var name = tokens[pos].value;

    if (tokens[pos++].type === TokenType.DecimalNumber) {
        if (pos < tokens.length && tokens[pos].type === TokenType.Identifier) {
            name += tokens[pos++].value;
        }
    }

    return name;
}

function checkExcluding(_i) {
    var start = _i;
    var type;

    for (; _i < tokens.length; _i++) {
        type = tokens[_i].type;

        if (type === TokenType.Space ||
            type === TokenType.LeftParenthesis ||
            type === TokenType.RightParenthesis) {
            break;
        }
    }

    return _i - start - 1;
}

function joinValues(start, finish) {
    var s = '';

    for (var i = start; i <= finish; i++) {
        s += tokens[i].value;
    }

    return s;
}

function joinValues2(start, num) {
    if (start + num - 1 >= tokens.length) {
        return;
    }

    var s = '';

    for (var i = 0; i < num; i++) {
        s += tokens[start + i].value;
    }

    return s;
}

module.exports = function parse(source, rule, needInfo) {
    tokens = tokenize(source);
    rule = rule || 'stylesheet';
    pos = 0;

    var ast = CSSPRules[rule]();

    if (!ast && rule === 'stylesheet') {
        return needInfo ? [{}, rule] : [rule];
    }

    if (!needInfo) {
        ast = cleanInfo(ast);
    }

    // console.log(require('../utils/stringify.js')(require('../utils/cleanInfo.js')(ast), true));
    return ast;
};
