var TokenType = require('./const.js');
var tokenize = require('./tokenize.js');

var tokens;
var needInfo;
var pos;
var failLN;
var currentBlockLN;

var NodeType = {
    IdentType: 'ident',
    AtkeywordType: 'atkeyword',
    StringType: 'string',
    ShashType: 'shash',
    VhashType: 'vhash',
    NumberType: 'number',
    PercentageType: 'percentage',
    DimensionType: 'dimension',
    DecldelimType: 'decldelim',
    SType: 's',
    AttrselectorType: 'attrselector',
    AttribType: 'attrib',
    NthType: 'nth',
    NthselectorType: 'nthselector',
    NamespaceType: 'namespace',
    ClazzType: 'clazz',
    PseudoeType: 'pseudoe',
    PseudocType: 'pseudoc',
    DelimType: 'delim',
    StylesheetType: 'stylesheet',
    AtrulebType: 'atruleb',
    AtrulesType: 'atrules',
    AtrulerqType: 'atrulerq',
    AtrulersType: 'atrulers',
    AtrulerType: 'atruler',
    BlockType: 'block',
    RulesetType: 'ruleset',
    CombinatorType: 'combinator',
    SimpleselectorType: 'simpleselector',
    SelectorType: 'selector',
    DeclarationType: 'declaration',
    PropertyType: 'property',
    ImportantType: 'important',
    UnaryType: 'unary',
    OperatorType: 'operator',
    BracesType: 'braces',
    ValueType: 'value',
    ProgidType: 'progid',
    FiltervType: 'filterv',
    FilterType: 'filter',
    CommentType: 'comment',
    UriType: 'uri',
    RawType: 'raw',
    FunctionBodyType: 'functionBody',
    FunktionType: 'funktion',
    FunctionExpressionType: 'functionExpression',
    UnknownType: 'unknown'
};

var CSSPRules = {
    'ident': function() { if (checkIdent(pos)) return getIdent() },
    'atkeyword': function() { if (checkAtkeyword(pos)) return getAtkeyword() },
    'string': function() { if (checkString(pos)) return getString() },
    'shash': function() { if (checkShash(pos)) return getShash() },
    'vhash': function() { if (checkVhash(pos)) return getVhash() },
    'number': function() { if (checkNumber(pos)) return getNumber() },
    'percentage': function() { if (checkPercentage(pos)) return getPercentage() },
    'dimension': function() { if (checkDimension(pos)) return getDimension() },
    'decldelim': function() { if (checkDecldelim(pos)) return getDecldelim() },
    's': function() { if (checkS(pos)) return getS() },
    'attrselector': function() { if (checkAttrselector(pos)) return getAttrselector() },
    'attrib': function() { if (checkAttrib(pos)) return getAttrib() },
    'nth': function() { if (checkNth(pos)) return getNth() },
    'nthselector': function() { if (checkNthselector(pos)) return getNthselector() },
    'namespace': function() { if (checkNamespace(pos)) return getNamespace() },
    'clazz': function() { if (checkClazz(pos)) return getClazz() },
    'pseudoe': function() { if (checkPseudoe(pos)) return getPseudoe() },
    'pseudoc': function() { if (checkPseudoc(pos)) return getPseudoc() },
    'delim': function() { if (checkDelim(pos)) return getDelim() },
    'stylesheet': function() { if (checkStylesheet(pos)) return getStylesheet() },
    'atruleb': function() { if (checkAtruleb(pos)) return getAtruleb() },
    'atrules': function() { if (checkAtrules(pos)) return getAtrules() },
    'atrulerq': function() { if (checkAtrulerq(pos)) return getAtrulerq() },
    'atrulers': function() { if (checkAtrulers(pos)) return getAtrulers() },
    'atruler': function() { if (checkAtruler(pos)) return getAtruler() },
    'block': function() { if (checkBlock(pos)) return getBlock() },
    'ruleset': function() { if (checkRuleset(pos)) return getRuleset() },
    'combinator': function() { if (checkCombinator(pos)) return getCombinator() },
    'simpleselector': function() { if (checkSimpleselector(pos)) return getSimpleSelector() },
    'selector': function() { if (checkSelector(pos)) return getSelector() },
    'declaration': function() { if (checkDeclaration(pos)) return getDeclaration() },
    'property': function() { if (checkProperty(pos)) return getProperty() },
    'important': function() { if (checkImportant(pos)) return getImportant() },
    'unary': function() { if (checkUnary(pos)) return getUnary() },
    'operator': function() { if (checkOperator(pos)) return getOperator() },
    'braces': function() { if (checkBraces(pos)) return getBraces() },
    'value': function() { if (checkValue(pos)) return getValue() },
    'progid': function() { if (checkProgid(pos)) return getProgid() },
    'filterv': function() { if (checkFilterv(pos)) return getFilterv() },
    'filter': function() { if (checkFilter(pos)) return getFilter() },
    'comment': function() { if (checkComment(pos)) return getComment() },
    'uri': function() { if (checkUri(pos)) return getUri() },
    'funktion': function() { if (checkFunktion(pos)) return getFunktion() },
    'functionExpression': function() { if (checkFunctionExpression(pos)) return getFunctionExpression() },
    'unknown': function() { if (checkUnknown(pos)) return getUnknown() }
};

function fail(token) {
    if (token && token.line > failLN) {
        failLN = token.line;
    }
}

function throwError() {
    throw new Error('Please check the validity of the CSS block starting from the line #' + currentBlockLN);
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
    var result;

    if (needInfo) {
        result = [getInfo(pos), type];
    } else {
        result = [type];
    }

    return result;
}

//any = braces | string | percentage | dimension | number | uri | functionExpression | funktion | ident | unary
function checkAny(_i) {
    return checkBraces(_i) ||
           checkString(_i) ||
           checkPercentage(_i) ||
           checkDimension(_i) ||
           checkNumber(_i) ||
           checkUri(_i) ||
           checkFunctionExpression(_i) ||
           checkFunktion(_i) ||
           checkIdent(_i) ||
           checkUnary(_i);
}

function getAny() {
    if (checkBraces(pos)) return getBraces();
    else if (checkString(pos)) return getString();
    else if (checkPercentage(pos)) return getPercentage();
    else if (checkDimension(pos)) return getDimension();
    else if (checkNumber(pos)) return getNumber();
    else if (checkUri(pos)) return getUri();
    else if (checkFunctionExpression(pos)) return getFunctionExpression();
    else if (checkFunktion(pos)) return getFunktion();
    else if (checkIdent(pos)) return getIdent();
    else if (checkUnary(pos)) return getUnary();
}

//atkeyword = '@' ident:x -> [#atkeyword, x]
function checkAtkeyword(_i) {
    var l;

    if (tokens[_i++].type !== TokenType.CommercialAt) return fail(tokens[_i - 1]);

    if (l = checkIdent(_i)) return l + 1;

    return fail(tokens[_i]);
}

function getAtkeyword() {
    var startPos = pos;

    pos++;

    return needInfo?
        [getInfo(startPos), NodeType.AtkeywordType, getIdent()]:
        [NodeType.AtkeywordType, getIdent()];
}

//attrib = '[' sc*:s0 ident:x sc*:s1 attrselector:a sc*:s2 (ident | string):y sc*:s3 ']' -> this.concat([#attrib], s0, [x], s1, [a], s2, [y], s3)
//       | '[' sc*:s0 ident:x sc*:s1 ']' -> this.concat([#attrib], s0, [x], s1),
function checkAttrib(_i) {
    if (tokens[_i].type !== TokenType.LeftSquareBracket) return fail(tokens[_i]);

    if (!tokens[_i].right) return fail(tokens[_i]);

    return tokens[_i].right - _i + 1;
}

function checkAttrib1(_i) {
    var start = _i;

    _i++;

    var l = checkSC(_i); // s0

    if (l) _i += l;

    if (l = checkIdent(_i, true)) _i += l; // x
    else return fail(tokens[_i]);

    if (tokens[_i].type === TokenType.VerticalLine &&
        tokens[_i + 1].type !== TokenType.EqualsSign) {
        _i++;
        if (l = checkIdent(_i, true)) _i += l; // x
        else return fail(tokens[_i]);
    }

    if (l = checkSC(_i)) _i += l; // s1

    if (l = checkAttrselector(_i)) _i += l; // a
    else return fail(tokens[_i]);

    if (l = checkSC(_i)) _i += l; // s2

    if ((l = checkIdent(_i)) || (l = checkString(_i))) _i += l; // y
    else return fail(tokens[_i]);

    if (l = checkSC(_i)) _i += l; // s3

    if (tokens[_i].type === TokenType.RightSquareBracket) return _i - start;

    return fail(tokens[_i]);
}

function getAttrib1() {
    var startPos = pos;

    pos++;

    var a = (needInfo? [getInfo(startPos), NodeType.AttribType] : [NodeType.AttribType]);

    a = a.concat(
        getSC(),
        [getIdent()]
    );

    if (tokens[pos].type === TokenType.VerticalLine &&
        tokens[pos + 1].type !== TokenType.EqualsSign) {
        a.push(
            getNamespace(),
            getIdent()
        );
    }
    
    a = a.concat(
        getSC(),
        [getAttrselector()],
        getSC(),
        [checkString(pos) ? getString() : getIdent()],
        getSC()
    );

    pos++;

    return a;
}

function checkAttrib2(_i) {
    var start = _i;

    _i++;

    var l = checkSC(_i);

    if (l) _i += l;

    if (l = checkIdent(_i, true)) _i += l;

    if (tokens[_i].type === TokenType.VerticalLine &&
        tokens[_i + 1].type !== TokenType.EqualsSign) {
        _i++;
        if (l = checkIdent(_i, true)) _i += l; // x
        else return fail(tokens[_i]);
    }

    if (l = checkSC(_i)) _i += l;

    if (tokens[_i].type === TokenType.RightSquareBracket) return _i - start;

    return fail(tokens[_i]);
}

function getAttrib2() {
    var startPos = pos;

    pos++;

    var a = (needInfo? [getInfo(startPos), NodeType.AttribType] : [NodeType.AttribType])
        .concat(
            getSC(),
            [getIdent()]
        );

    if (tokens[pos].type === TokenType.VerticalLine &&
        tokens[pos + 1].type !== TokenType.EqualsSign) {
        a.push(
            getNamespace(),
            getIdent()
        );
    }

    a = a.concat(
        getSC()
    );

    pos++;

    return a;
}

function getAttrib() {
    if (checkAttrib1(pos)) return getAttrib1();
    if (checkAttrib2(pos)) return getAttrib2();
}

//attrselector = (seq('=') | seq('~=') | seq('^=') | seq('$=') | seq('*=') | seq('|=')):x -> [#attrselector, x]
function checkAttrselector(_i) {
    if (tokens[_i].type === TokenType.EqualsSign) return 1;
    if (tokens[_i].type === TokenType.VerticalLine && (!tokens[_i + 1] || tokens[_i + 1].type !== TokenType.EqualsSign)) return 1;

    if (!tokens[_i + 1] || tokens[_i + 1].type !== TokenType.EqualsSign) return fail(tokens[_i]);

    switch(tokens[_i].type) {
        case TokenType.Tilde:
        case TokenType.CircumflexAccent:
        case TokenType.DollarSign:
        case TokenType.Asterisk:
        case TokenType.VerticalLine:
            return 2;
    }

    return fail(tokens[_i]);
}

function getAttrselector() {
    var startPos = pos,
        s = tokens[pos++].value;

    if (tokens[pos] && tokens[pos].type === TokenType.EqualsSign) s += tokens[pos++].value;

    return needInfo?
            [getInfo(startPos), NodeType.AttrselectorType, s] :
            [NodeType.AttrselectorType, s];
}

//atrule = atruler | atruleb | atrules
function checkAtrule(_i) {
    var start = _i,
        l;

    if (tokens[start].atrule_l !== undefined) return tokens[start].atrule_l;

    if (l = checkAtruler(_i)) tokens[_i].atrule_type = 1;
    else if (l = checkAtruleb(_i)) tokens[_i].atrule_type = 2;
    else if (l = checkAtrules(_i)) tokens[_i].atrule_type = 3;
    else return fail(tokens[start]);

    tokens[start].atrule_l = l;

    return l;
}

function getAtrule() {
    switch (tokens[pos].atrule_type) {
        case 1: return getAtruler();
        case 2: return getAtruleb();
        case 3: return getAtrules();
    }
}

//atruleb = atkeyword:ak tset*:ap block:b -> this.concat([#atruleb, ak], ap, [b])
function checkAtruleb(_i) {
    var start = _i,
        l;

    if (l = checkAtkeyword(_i)) _i += l;
    else return fail(tokens[_i]);

    if (l = checkTsets(_i)) _i += l;

    if (l = checkBlock(_i)) _i += l;
    else return fail(tokens[_i]);

    return _i - start;
}

function getAtruleb() {
    return (needInfo?
                [getInfo(pos), NodeType.AtrulebType, getAtkeyword()] :
                [NodeType.AtrulebType, getAtkeyword()])
                    .concat(getTsets())
                    .concat([getBlock()]);
}

//atruler = atkeyword:ak atrulerq:x '{' atrulers:y '}' -> [#atruler, ak, x, y]
function checkAtruler(_i) {
    var start = _i,
        l;

    if (l = checkAtkeyword(_i)) _i += l;
    else return fail(tokens[_i]);

    if (l = checkAtrulerq(_i)) _i += l;

    if (_i < tokens.length && tokens[_i].type === TokenType.LeftCurlyBracket) _i++;
    else return fail(tokens[_i]);

    if (l = checkAtrulers(_i)) _i += l;

    if (_i < tokens.length && tokens[_i].type === TokenType.RightCurlyBracket) _i++;
    else return fail(tokens[_i]);

    return _i - start;
}

function getAtruler() {
    var atruler = needInfo?
                    [getInfo(pos), NodeType.AtrulerType, getAtkeyword(), getAtrulerq()] :
                    [NodeType.AtrulerType, getAtkeyword(), getAtrulerq()];

    pos++;

    atruler.push(getAtrulers());

    pos++;

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
    var start = _i,
        l;

    if (l = checkSC(_i)) _i += l;

    while ((l = checkRuleset(_i)) || (l = checkAtrule(_i)) || (l = checkSC(_i))) {
        _i += l;
    }

    tokens[_i].atrulers_end = 1;

    if (l = checkSC(_i)) _i += l;

    return _i - start;
}

function getAtrulers() {
    var atrulers = createToken(NodeType.AtrulersType).concat(getSC());

    while (!tokens[pos].atrulers_end) {
        if (checkSC(pos)) {
            atrulers = atrulers.concat(getSC());
        } else if (checkRuleset(pos)) {
            atrulers.push(getRuleset());
        } else {
            atrulers.push(getAtrule());
        }
    }

    return atrulers.concat(getSC());
}

//atrules = atkeyword:ak tset*:ap ';' -> this.concat([#atrules, ak], ap)
function checkAtrules(_i) {
    var start = _i,
        l;

    if (l = checkAtkeyword(_i)) _i += l;
    else return fail(tokens[_i]);

    if (l = checkTsets(_i)) _i += l;

    if (_i >= tokens.length) return _i - start;

    if (tokens[_i].type === TokenType.Semicolon) _i++;
    else return fail(tokens[_i]);

    return _i - start;
}

function getAtrules() {
    var atrules = (needInfo? [getInfo(pos), NodeType.AtrulesType, getAtkeyword()] : [NodeType.AtrulesType, getAtkeyword()]).concat(getTsets());

    pos++;

    return atrules;
}

//block = '{' blockdecl*:x '}' -> this.concatContent([#block], x)
function checkBlock(_i) {
    if (_i < tokens.length && tokens[_i].type === TokenType.LeftCurlyBracket) return tokens[_i].right - _i + 1;

    return fail(tokens[_i]);
}

function getBlock() {
    var block = createToken(NodeType.BlockType);
    var end = tokens[pos].right;

    pos++;

    while (pos < end) {
        if (checkBlockdecl(pos)) block = block.concat(getBlockdecl());
        else throwError();
    }

    pos = end + 1;

    return block;
}

//blockdecl = sc*:s0 (filter | declaration):x decldelim:y sc*:s1 -> this.concat(s0, [x], [y], s1)
//          | sc*:s0 (filter | declaration):x sc*:s1 -> this.concat(s0, [x], s1)
//          | sc*:s0 decldelim:x sc*:s1 -> this.concat(s0, [x], s1)
//          | sc+:s0 -> s0

function checkBlockdecl(_i) {
    var l;

    if (l = _checkBlockdecl0(_i)) tokens[_i].bd_type = 1;
    else if (l = _checkBlockdecl1(_i)) tokens[_i].bd_type = 2;
    else if (l = _checkBlockdecl2(_i)) tokens[_i].bd_type = 3;
    else if (l = _checkBlockdecl3(_i)) tokens[_i].bd_type = 4;
    else return fail(tokens[_i]);

    return l;
}

function getBlockdecl() {
    switch (tokens[pos].bd_type) {
        case 1: return _getBlockdecl0();
        case 2: return _getBlockdecl1();
        case 3: return _getBlockdecl2();
        case 4: return _getBlockdecl3();
    }
}

//sc*:s0 (filter | declaration):x decldelim:y sc*:s1 -> this.concat(s0, [x], [y], s1)
function _checkBlockdecl0(_i) {
    var start = _i,
        l;

    if (l = checkSC(_i)) _i += l;

    if (l = checkFilter(_i)) {
        tokens[_i].bd_filter = 1;
        _i += l;
    } else if (l = checkDeclaration(_i)) {
        tokens[_i].bd_decl = 1;
        _i += l;
    } else return fail(tokens[_i]);

    if (_i < tokens.length && (l = checkDecldelim(_i))) _i += l;
    else return fail(tokens[_i]);

    if (l = checkSC(_i)) _i += l;

    return _i - start;
}

function _getBlockdecl0() {
    return getSC()
            .concat([tokens[pos].bd_filter? getFilter() : getDeclaration()])
            .concat([getDecldelim()])
            .concat(getSC());
}

//sc*:s0 (filter | declaration):x sc*:s1 -> this.concat(s0, [x], s1)
function _checkBlockdecl1(_i) {
    var start = _i,
        l;

    if (l = checkSC(_i)) _i += l;

    if (l = checkFilter(_i)) {
        tokens[_i].bd_filter = 1;
        _i += l;
    } else if (l = checkDeclaration(_i)) {
        tokens[_i].bd_decl = 1;
        _i += l;
    } else return fail(tokens[_i]);

    if (l = checkSC(_i)) _i += l;

    return _i - start;
}

function _getBlockdecl1() {
    return getSC()
            .concat([tokens[pos].bd_filter? getFilter() : getDeclaration()])
            .concat(getSC());
}

//sc*:s0 decldelim:x sc*:s1 -> this.concat(s0, [x], s1)
function _checkBlockdecl2(_i) {
    var start = _i,
        l;

    if (l = checkSC(_i)) _i += l;

    if (l = checkDecldelim(_i)) _i += l;
    else return fail(tokens[_i]);

    if (l = checkSC(_i)) _i += l;

    return _i - start;
}

function _getBlockdecl2() {
    return getSC()
             .concat([getDecldelim()])
             .concat(getSC());
}

//sc+:s0 -> s0
function _checkBlockdecl3(_i) {
    return checkSC(_i);
}

function _getBlockdecl3() {
    return getSC();
}

//braces = '(' tset*:x ')' -> this.concat([#braces, '(', ')'], x)
//       | '[' tset*:x ']' -> this.concat([#braces, '[', ']'], x)
function checkBraces(_i) {
    if (_i >= tokens.length ||
        (tokens[_i].type !== TokenType.LeftParenthesis &&
         tokens[_i].type !== TokenType.LeftSquareBracket)
        ) return fail(tokens[_i]);

    return tokens[_i].right - _i + 1;
}

function getBraces() {
    var startPos = pos,
        left = pos,
        right = tokens[pos].right;

    pos++;

    var tsets = getTsets();

    pos++;

    return needInfo?
            [getInfo(startPos), NodeType.BracesType, tokens[left].value, tokens[right].value].concat(tsets) :
            [NodeType.BracesType, tokens[left].value, tokens[right].value].concat(tsets);
}

// node: Clazz
function checkClazz(_i) {
    var token = tokens[_i];
    var l;

    if (token.clazz_l) return token.clazz_l;

    if (token.type === TokenType.FullStop) {
        // otherwise it's converts to dimension and some part of selector lost (issue 99)
        if (tokens[_i + 1].type === 'DecimalNumber' &&
            !/\D/.test(tokens[_i + 1].value)) {
            _i++;
        }

        if (l = checkIdent(_i + 1)) {
            token.clazz_l = l + 1;
            return l + 1;
        }
    }

    return fail(token);
}

function getClazz() {
    var startPos = pos;
    var clazz_l = pos + tokens[pos].clazz_l;
    pos++;
    var ident = createToken(NodeType.IdentType).concat(joinValues(pos, clazz_l - 1));

    pos = clazz_l;

    return needInfo?
            [getInfo(startPos), NodeType.ClazzType, ident] :
            [NodeType.ClazzType, ident];
}

// node: Combinator
function checkCombinator(_i) {
    if (tokens[_i].type === TokenType.PlusSign ||
        tokens[_i].type === TokenType.GreaterThanSign ||
        tokens[_i].type === TokenType.Tilde) {
        return 1;
    }

    if (tokens[_i + 0].type === TokenType.Solidus &&
        tokens[_i + 1].type === TokenType.Identifier && tokens[_i + 1].value === 'deep' &&
        tokens[_i + 2].type === TokenType.Solidus) {
        return 3;
    }

    return fail(tokens[_i]);
}

function getCombinator() {
    var combinator = tokens[pos].value;

    if (tokens[pos].type === TokenType.Solidus) {
        combinator = '/deep/';
        pos += 3;
    } else {
        pos += 1;
    }

    return needInfo?
            [getInfo(pos), NodeType.CombinatorType, combinator] :
            [NodeType.CombinatorType, combinator];
}

// node: Comment
function checkComment(_i) {
    if (tokens[_i].type === TokenType.CommentML) return 1;

    return fail(tokens[_i]);
}

function getComment() {
    var startPos = pos,
        s = tokens[pos].value.substring(2),
        l = s.length;

    if (s.charAt(l - 2) === '*' && s.charAt(l - 1) === '/') s = s.substring(0, l - 2);

    pos++;

    return needInfo?
            [getInfo(startPos), NodeType.CommentType, s] :
            [NodeType.CommentType, s];
}

// declaration = property:x ':' value:y -> [#declaration, x, y]
function checkDeclaration(_i) {
    var start = _i,
        l;

    if (l = checkProperty(_i)) _i += l;
    else return fail(tokens[_i]);

    if (_i < tokens.length && tokens[_i].type === TokenType.Colon) _i++;
    else return fail(tokens[_i]);

    if (l = checkValue(_i)) _i += l;
    else return fail(tokens[_i]);

    return _i - start;
}

function getDeclaration() {
    var declaration = needInfo?
            [getInfo(pos), NodeType.DeclarationType, getProperty()] :
            [NodeType.DeclarationType, getProperty()];

    pos++;

    declaration.push(getValue());

    return declaration;
}

// node: Decldelim
function checkDecldelim(_i) {
    if (_i < tokens.length && tokens[_i].type === TokenType.Semicolon) return 1;

    return fail(tokens[_i]);
}

function getDecldelim() {
    var startPos = pos;

    pos++;

    return needInfo?
            [getInfo(startPos), NodeType.DecldelimType] :
            [NodeType.DecldelimType];
}

// node: Delim
function checkDelim(_i) {
    if (_i < tokens.length && tokens[_i].type === TokenType.Comma) return 1;

    if (_i >= tokens.length) return fail(tokens[tokens.length - 1]);

    return fail(tokens[_i]);
}

function getDelim() {
    var startPos = pos;

    pos++;

    return needInfo?
            [getInfo(startPos), NodeType.DelimType] :
            [NodeType.DelimType];
}

// node: Dimension
function checkDimension(_i) {
    var ln = checkNumber(_i),
        li;

    if (!ln || (ln && _i + ln >= tokens.length)) return fail(tokens[_i]);

    if (li = checkNmName2(_i + ln)) return ln + li;

    return fail(tokens[_i]);
}

function getDimension() {
    var startPos = pos,
        n = getNumber(),
        dimension = needInfo ?
            [getInfo(pos), NodeType.IdentType, getNmName2()] :
            [NodeType.IdentType, getNmName2()];

    return needInfo?
            [getInfo(startPos), NodeType.DimensionType, n, dimension] :
            [NodeType.DimensionType, n, dimension];
}

//filter = filterp:x ':' filterv:y -> [#filter, x, y]
function checkFilter(_i) {
    var start = _i,
        l;

    if (l = checkFilterp(_i)) _i += l;
    else return fail(tokens[_i]);

    if (tokens[_i].type === TokenType.Colon) _i++;
    else return fail(tokens[_i]);

    if (l = checkFilterv(_i)) _i += l;
    else return fail(tokens[_i]);

    return _i - start;
}

function getFilter() {
    var filter = needInfo?
            [getInfo(pos), NodeType.FilterType, getFilterp()] :
            [NodeType.FilterType, getFilterp()];

    pos++;

    filter.push(getFilterv());

    return filter;
}

//filterp = (seq('-filter') | seq('_filter') | seq('*filter') | seq('-ms-filter') | seq('filter')):t sc*:s0 -> this.concat([#property, [#ident, t]], s0)
function checkFilterp(_i) {
    var start = _i,
        l,
        x;

    if (_i < tokens.length) {
        if (tokens[_i].value === 'filter') l = 1;
        else {
            x = joinValues2(_i, 2);

            if (x === '-filter' || x === '_filter' || x === '*filter') l = 2;
            else {
                x = joinValues2(_i, 4);

                if (x === '-ms-filter') l = 4;
                else return fail(tokens[_i]);
            }
        }

        tokens[start].filterp_l = l;

        _i += l;

        if (checkSC(_i)) _i += l;

        return _i - start;
    }

    return fail(tokens[_i]);
}

function getFilterp() {
    var startPos = pos,
        x = joinValues2(pos, tokens[pos].filterp_l),
        ident = needInfo? [getInfo(startPos), NodeType.IdentType, x] : [NodeType.IdentType, x];

    pos += tokens[pos].filterp_l;

    return (needInfo? [getInfo(startPos), NodeType.PropertyType, ident] : [NodeType.PropertyType, ident])
                .concat(getSC());

}

//filterv = progid+:x -> [#filterv].concat(x)
function checkFilterv(_i) {
    var start = _i,
        l;

    if (l = checkProgid(_i)) _i += l;
    else return fail(tokens[_i]);

    while (l = checkProgid(_i)) {
        _i += l;
    }

    tokens[start].last_progid = _i;

    if (_i < tokens.length && (l = checkSC(_i))) _i += l;

    if (_i < tokens.length && (l = checkImportant(_i))) _i += l;

    return _i - start;
}

function getFilterv() {
    var filterv = createToken(NodeType.FiltervType);
    var last_progid = tokens[pos].last_progid;

    while (pos < last_progid) {
        filterv.push(getProgid());
    }

    filterv = filterv.concat(checkSC(pos) ? getSC() : []);

    if (pos < tokens.length && checkImportant(pos)) filterv.push(getImportant());

    return filterv;
}

//functionExpression = ``expression('' functionExpressionBody*:x ')' -> [#functionExpression, x.join('')],
function checkFunctionExpression(_i) {
    var start = _i;

    if (!tokens[_i] || tokens[_i++].value !== 'expression') return fail(tokens[_i - 1]);

    if (!tokens[_i] || tokens[_i].type !== TokenType.LeftParenthesis) return fail(tokens[_i]);

    return tokens[_i].right - start + 1;
}

function getFunctionExpression() {
    var startPos = pos;

    pos++;

    var e = joinValues(pos + 1, tokens[pos].right - 1);

    pos = tokens[pos].right + 1;

    return needInfo?
            [getInfo(startPos), NodeType.FunctionExpressionType, e] :
            [NodeType.FunctionExpressionType, e];
}

//funktion = ident:x '(' functionBody:y ')' -> [#funktion, x, y]
function checkFunktion(_i) {
    var start = _i,
        l = checkIdent(_i);

    if (!l) return fail(tokens[_i]);

    _i += l;

    if (_i >= tokens.length || tokens[_i].type !== TokenType.LeftParenthesis) return fail(tokens[_i - 1]);

    return tokens[_i].right - start + 1;
}

function getFunktion() {
    var startPos = pos,
        ident = getIdent();

    pos++;

    var body = ident[needInfo? 2 : 1] !== 'not'?
        getFunctionBody() :
        getNotFunctionBody(); // ok, here we have CSS3 initial draft: http://dev.w3.org/csswg/selectors3/#negation

    return needInfo?
            [getInfo(startPos), NodeType.FunktionType, ident, body] :
            [NodeType.FunktionType, ident, body];
}

function getFunctionBody() {
    var startPos = pos,
        body = [],
        x;

    while (tokens[pos].type !== TokenType.RightParenthesis) {
        if (checkTset(pos)) {
            x = getTset();
            if ((needInfo && typeof x[1] === 'string') || typeof x[0] === 'string') body.push(x);
            else body = body.concat(x);
        } else if (checkClazz(pos)) {
            body.push(getClazz());
        } else {
            throwError();
        }
    }

    pos++;

    return (needInfo?
                [getInfo(startPos), NodeType.FunctionBodyType] :
                [NodeType.FunctionBodyType]
            ).concat(body);
}

function getNotFunctionBody() {
    var startPos = pos,
        body = [];

    while (tokens[pos].type !== TokenType.RightParenthesis) {
        if (checkSimpleselector(pos)) {
            body.push(getSimpleSelector());
        } else {
            throwError();
        }
    }

    pos++;

    return (needInfo?
                [getInfo(startPos), NodeType.FunctionBodyType] :
                [NodeType.FunctionBodyType]
            ).concat(body);
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
function checkIdent(_i, attribute) {
    if (_i >= tokens.length) return fail(tokens[_i]);

    var start = _i,
        wasIdent = false;

    // unicode-range-token
    if (tokens[_i].type === TokenType.Identifier &&
        (tokens[_i].value === 'U' || tokens[_i].value === 'u') &&
        tokens[_i + 1].type === TokenType.PlusSign) {
        var unicodeRange = getUnicodeRange(_i + 2, true);
        if (unicodeRange) {
            tokens[start].ident_last = unicodeRange - 1;
            return unicodeRange + 2;
        }
    }

    if (tokens[_i].type === TokenType.LowLine) return checkIdentLowLine(_i, attribute);

    // start char / word
    if (tokens[_i].type === TokenType.HyphenMinus ||
        tokens[_i].type === TokenType.Identifier ||
        tokens[_i].type === TokenType.DollarSign ||
        tokens[_i].type === TokenType.Asterisk) _i++;
    else return fail(tokens[_i]);

    wasIdent = tokens[_i - 1].type === TokenType.Identifier;

    for (; _i < tokens.length; _i++) {
        if (tokens[_i].type !== TokenType.HyphenMinus &&
            tokens[_i].type !== TokenType.LowLine) {
                if (tokens[_i].type !== TokenType.Identifier &&
                    (!attribute || tokens[_i].type !== TokenType.Colon) &&
                    (!wasIdent || tokens[_i].type !== TokenType.DecimalNumber)
                    ) break;
                else wasIdent = true;
        }
    }

    if (!wasIdent && tokens[start].type !== TokenType.Asterisk) return fail(tokens[_i]);

    tokens[start].ident_last = _i - 1;

    return _i - start;
}

function checkIdentLowLine(_i, attribute) {
    var start = _i;

    _i++;

    for (; _i < tokens.length; _i++) {
        if (tokens[_i].type !== TokenType.HyphenMinus &&
            tokens[_i].type !== TokenType.DecimalNumber &&
            tokens[_i].type !== TokenType.LowLine &&
            tokens[_i].type !== TokenType.Identifier &&
            (!attribute || tokens[_i].type !== TokenType.Colon)) break;
    }

    tokens[start].ident_last = _i - 1;

    return _i - start;
}

function getIdent() {
    var startPos = pos,
        s = joinValues(pos, tokens[pos].ident_last);

    pos = tokens[pos].ident_last + 1;

    return needInfo?
            [getInfo(startPos), NodeType.IdentType, s] :
            [NodeType.IdentType, s];
}

//important = '!' sc*:s0 seq('important') -> [#important].concat(s0)
function checkImportant(_i) {
    var start = _i,
        l;

    if (tokens[_i++].type !== TokenType.ExclamationMark) return fail(tokens[_i - 1]);

    if (l = checkSC(_i)) _i += l;

    if (tokens[_i].value.toLowerCase() !== 'important') return fail(tokens[_i]);

    return _i - start + 1;
}

function getImportant() {
    var startPos = pos;

    pos++;

    var sc = getSC();

    pos++;

    return (needInfo? [getInfo(startPos), NodeType.ImportantType] : [NodeType.ImportantType]).concat(sc);
}

// node: Namespace
function checkNamespace(_i) {
    if (tokens[_i].type === TokenType.VerticalLine) return 1;

    return fail(tokens[_i]);
}

function getNamespace() {
    var startPos = pos;

    pos++;

    return needInfo?
            [getInfo(startPos), NodeType.NamespaceType] :
            [NodeType.NamespaceType];
}

//nth = (digit | 'n')+:x -> [#nth, x.join('')]
//    | (seq('even') | seq('odd')):x -> [#nth, x]
function checkNth(_i) {
    return checkNth1(_i) || checkNth2(_i);
}

function checkNth1(_i) {
    var start = _i;

    for (; _i < tokens.length; _i++) {
        if (tokens[_i].type !== TokenType.DecimalNumber && tokens[_i].value !== 'n') break;
    }

    if (_i !== start) {
        tokens[start].nth_last = _i - 1;
        return _i - start;
    }

    return fail(tokens[_i]);
}

function getNth() {
    var startPos = pos;

    if (tokens[pos].nth_last) {
        var n = needInfo?
                    [getInfo(startPos), NodeType.NthType, joinValues(pos, tokens[pos].nth_last)] :
                    [NodeType.NthType, joinValues(pos, tokens[pos].nth_last)];

        pos = tokens[pos].nth_last + 1;

        return n;
    }

    return needInfo?
            [getInfo(startPos), NodeType.NthType, tokens[pos++].value] :
            [NodeType.NthType, tokens[pos++].value];
}

function checkNth2(_i) {
    if (tokens[_i].value === 'even' || tokens[_i].value === 'odd') return 1;

    return fail(tokens[_i]);
}

//nthf = ':' seq('nth-'):x (seq('child') | seq('last-child') | seq('of-type') | seq('last-of-type')):y -> (x + y)
function checkNthf(_i) {
    var start = _i,
        l = 0;

    if (tokens[_i++].type !== TokenType.Colon) return fail(tokens[_i - 1]); l++;

    if (tokens[_i++].value !== 'nth' || tokens[_i++].value !== '-') return fail(tokens[_i - 1]); l += 2;

    if ('child' === tokens[_i].value) {
        l += 1;
    } else if ('last-child' === tokens[_i].value +
                                tokens[_i + 1].value +
                                tokens[_i + 2].value) {
        l += 3;
    } else if ('of-type' === tokens[_i].value +
                             tokens[_i + 1].value +
                             tokens[_i + 2].value) {
        l += 3;
    } else if ('last-of-type' === tokens[_i].value +
                                  tokens[_i + 1].value +
                                  tokens[_i + 2].value +
                                  tokens[_i + 3].value +
                                  tokens[_i + 4].value) {
        l += 5;
    } else return fail(tokens[_i]);

    tokens[start + 1].nthf_last = start + l - 1;

    return l;
}

function getNthf() {
    pos++;

    var s = joinValues(pos, tokens[pos].nthf_last);

    pos = tokens[pos].nthf_last + 1;

    return s;
}

//nthselector = nthf:x '(' (sc | unary | nth)*:y ')' -> [#nthselector, [#ident, x]].concat(y)
function checkNthselector(_i) {
    var start = _i,
        l;

    if (l = checkNthf(_i)) _i += l;
    else return fail(tokens[_i]);

    if (tokens[_i].type !== TokenType.LeftParenthesis || !tokens[_i].right) return fail(tokens[_i]);

    l++;

    var rp = tokens[_i++].right;

    while (_i < rp) {
        if (l = checkSC(_i)) _i += l;
        else if (l = checkUnary(_i)) _i += l;
        else if (l = checkNth(_i)) _i += l;
        else return fail(tokens[_i]);
    }

    return rp - start + 1;
}

function getNthselector() {
    var nthf = needInfo?
                [getInfo(pos), NodeType.IdentType, getNthf()] :
                [NodeType.IdentType, getNthf()],
        ns = needInfo?
                [getInfo(pos), NodeType.NthselectorType, nthf] :
                [NodeType.NthselectorType, nthf];

    pos++;

    while (tokens[pos].type !== TokenType.RightParenthesis) {
        if (checkSC(pos)) ns = ns.concat(getSC());
        else if (checkUnary(pos)) ns.push(getUnary());
        else if (checkNth(pos)) ns.push(getNth());
    }

    pos++;

    return ns;
}

// node: Number
function checkNumber(_i) {
    if (_i < tokens.length && tokens[_i].number_l) return tokens[_i].number_l;

    if (_i < tokens.length && tokens[_i].type === TokenType.DecimalNumber &&
        (!tokens[_i + 1] ||
         (tokens[_i + 1] && tokens[_i + 1].type !== TokenType.FullStop))
    ) return (tokens[_i].number_l = 1, tokens[_i].number_l); // 10

    if (_i < tokens.length &&
         tokens[_i].type === TokenType.DecimalNumber &&
         tokens[_i + 1] && tokens[_i + 1].type === TokenType.FullStop &&
         (!tokens[_i + 2] || (tokens[_i + 2].type !== TokenType.DecimalNumber))
    ) return (tokens[_i].number_l = 2, tokens[_i].number_l); // 10.

    if (_i < tokens.length &&
        tokens[_i].type === TokenType.FullStop &&
        tokens[_i + 1].type === TokenType.DecimalNumber
    ) return (tokens[_i].number_l = 2, tokens[_i].number_l); // .10

    if (_i < tokens.length &&
        tokens[_i].type === TokenType.DecimalNumber &&
        tokens[_i + 1] && tokens[_i + 1].type === TokenType.FullStop &&
        tokens[_i + 2] && tokens[_i + 2].type === TokenType.DecimalNumber
    ) return (tokens[_i].number_l = 3, tokens[_i].number_l); // 10.10

    return fail(tokens[_i]);
}

function getNumber() {
    var s = '',
        startPos = pos,
        l = tokens[pos].number_l;

    for (var i = 0; i < l; i++) {
        s += tokens[pos + i].value;
    }

    pos += l;

    return needInfo?
            [getInfo(startPos), NodeType.NumberType, s] :
            [NodeType.NumberType, s];
}

// node: Operator
function checkOperator(_i) {
    if (_i < tokens.length &&
        (tokens[_i].type === TokenType.Solidus ||
        tokens[_i].type === TokenType.Comma ||
        tokens[_i].type === TokenType.Colon ||
        tokens[_i].type === TokenType.EqualsSign)) return 1;

    return fail(tokens[_i]);
}

function getOperator() {
    return needInfo?
            [getInfo(pos), NodeType.OperatorType, tokens[pos++].value] :
            [NodeType.OperatorType, tokens[pos++].value];
}

// node: Percentage
function checkPercentage(_i) {
    var x = checkNumber(_i);

    if (!x || (x && _i + x >= tokens.length)) return fail(tokens[_i]);

    if (tokens[_i + x].type === TokenType.PercentSign) return x + 1;

    return fail(tokens[_i]);
}

function getPercentage() {
    var startPos = pos,
        n = getNumber();

    pos++;

    return needInfo?
            [getInfo(startPos), NodeType.PercentageType, n] :
            [NodeType.PercentageType, n];
}

//progid = sc*:s0 seq('progid:DXImageTransform.Microsoft.'):x letter+:y '(' (m_string | m_comment | ~')' char)+:z ')' sc*:s1
//                -> this.concat([#progid], s0, [[#raw, x + y.join('') + '(' + z.join('') + ')']], s1),
function checkProgid(_i) {
    var start = _i,
        l,
        x;

    if (l = checkSC(_i)) _i += l;

    if (_i < tokens.length - 1 && tokens[_i].value === 'progid' && tokens[_i + 1].type === TokenType.Colon) {
        _i += 2;
    } else return fail(tokens[_i]);

    if (l = checkSC(_i)) _i += l;

    if ((x = joinValues2(_i, 4)) === 'DXImageTransform.Microsoft.') {
        _i += 4;
    } else return fail(tokens[_i - 1]);

    if (l = checkIdent(_i)) _i += l;
    else return fail(tokens[_i]);

    if (l = checkSC(_i)) _i += l;

    if (tokens[_i].type === TokenType.LeftParenthesis) {
        tokens[start].progid_end = tokens[_i].right;
        _i = tokens[_i].right + 1;
    } else return fail(tokens[_i]);

    if (l = checkSC(_i)) _i += l;

    return _i - start;
}

function getProgid() {
    var startPos = pos,
        progid_end = tokens[pos].progid_end;

    return (needInfo? [getInfo(startPos), NodeType.ProgidType] : [NodeType.ProgidType])
            .concat(getSC())
            .concat([_getProgid(progid_end)])
            .concat(getSC());
}

function _getProgid(progid_end) {
    var startPos = pos,
        x = joinValues(pos, progid_end);

    pos = progid_end + 1;

    return needInfo?
            [getInfo(startPos), NodeType.RawType, x] :
            [NodeType.RawType, x];
}

//property = ident:x sc*:s0 -> this.concat([#property, x], s0)
function checkProperty(_i) {
    var start = _i,
        l;

    if (l = checkIdent(_i)) _i += l;
    else return fail(tokens[_i]);

    if (l = checkSC(_i)) _i += l;
    return _i - start;
}

function getProperty() {
    var startPos = pos;

    return (needInfo?
            [getInfo(startPos), NodeType.PropertyType, getIdent()] :
            [NodeType.PropertyType, getIdent()])
        .concat(getSC());
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
    var l;

    if (tokens[_i++].type !== TokenType.Colon) return fail(tokens[_i - 1]);

    if (tokens[_i++].type !== TokenType.Colon) return fail(tokens[_i - 1]);

    if (l = checkIdent(_i)) return l + 2;

    return fail(tokens[_i]);
}

function getPseudoe() {
    var startPos = pos;

    pos += 2;

    return needInfo?
            [getInfo(startPos), NodeType.PseudoeType, getIdent()] :
            [NodeType.PseudoeType, getIdent()];
}

//pseudoc = ':' (funktion | ident):x -> [#pseudoc, x]
function checkPseudoc(_i) {
    var l;

    if (tokens[_i++].type !== TokenType.Colon) return fail(tokens[_i - 1]);

    if ((l = checkFunktion(_i)) || (l = checkIdent(_i))) return l + 1;

    return fail(tokens[_i]);
}

function getPseudoc() {
    var startPos = pos;

    pos++;

    return needInfo?
            [getInfo(startPos), NodeType.PseudocType, checkFunktion(pos)? getFunktion() : getIdent()] :
            [NodeType.PseudocType, checkFunktion(pos)? getFunktion() : getIdent()];
}

//ruleset = selector*:x block:y -> this.concat([#ruleset], x, [y])
function checkRuleset(_i) {
    var start = _i,
        l;

    if (tokens[start].ruleset_l !== undefined) return tokens[start].ruleset_l;

    while (l = checkSelector(_i)) {
        _i += l;
    }

    if (l = checkBlock(_i)) _i += l;
    else return fail(tokens[_i]);

    tokens[start].ruleset_l = _i - start;

    return _i - start;
}

function getRuleset() {
    var ruleset = createToken(NodeType.RulesetType);

    while (!checkBlock(pos)) {
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

    return fail(tokens[_i]);
}

function getS() {
    var startPos = pos,
        s = tokens[pos].value;

    pos++;

    return needInfo? [getInfo(startPos), NodeType.SType, s] : [NodeType.SType, s];
}

function checkSC(_i) {
    var l,
        lsc = 0;

    while (_i < tokens.length) {
        if (!(l = checkS(_i)) && !(l = checkComment(_i))) break;
        _i += l;
        lsc += l;
    }

    if (lsc) return lsc;

    if (_i >= tokens.length) return fail(tokens[tokens.length - 1]);

    return fail(tokens[_i]);
}

function getSC() {
    var sc = [];

    while (pos < tokens.length) {
        if (checkS(pos)) sc.push(getS());
        else if (checkComment(pos)) sc.push(getComment());
        else break;
    }

    return sc;
}

//selector = (simpleselector | delim)+:x -> this.concat([#selector], x)
function checkSelector(_i) {
    var start = _i,
        l;

    if (_i < tokens.length) {
        while (l = checkSimpleselector(_i) || checkDelim(_i)) {
            _i += l;
        }

        tokens[start].selector_end = _i - 1;

        return _i - start;
    }
}

function getSelector() {
    var selector = createToken(NodeType.SelectorType);
    var selector_end = tokens[pos].selector_end;

    while (pos <= selector_end) {
        selector.push(checkDelim(pos) ? getDelim() : getSimpleSelector());
    }

    return selector;
}

// node: Shash
function checkShash(_i) {
    if (tokens[_i].type !== TokenType.NumberSign) return fail(tokens[_i]);

    var l = checkNmName(_i + 1);

    if (l) return l + 1;

    return fail(tokens[_i]);
}

function getShash() {
    var startPos = pos;

    pos++;

    return needInfo?
            [getInfo(startPos), NodeType.ShashType, getNmName()] :
            [NodeType.ShashType, getNmName()];
}

//simpleselector = (nthselector | combinator | attrib | pseudo | clazz | shash | any | sc | namespace)+:x -> this.concatContent([#simpleselector], [x])
function checkSimpleselector(_i) {
    var start = _i,
        l;

    while (_i < tokens.length) {
        if (l = _checkSimpleSelector(_i)) _i += l;
        else break;
    }

    if (_i - start) return _i - start;

    if (_i >= tokens.length) return fail(tokens[tokens.length - 1]);

    return fail(tokens[_i]);
}

function _checkSimpleSelector(_i) {
    return checkNthselector(_i) ||
           checkCombinator(_i) ||
           checkAttrib(_i) ||
           checkPseudo(_i) ||
           checkClazz(_i) ||
           checkShash(_i) ||
           checkAny(_i) ||
           checkSC(_i) ||
           checkNamespace(_i);
}

function getSimpleSelector() {
    var ss = createToken(NodeType.SimpleselectorType);
    var t;

    while (pos < tokens.length && _checkSimpleSelector(pos)) {
        t = _getSimpleSelector();

        if ((needInfo && typeof t[1] === 'string') || typeof t[0] === 'string') ss.push(t);
        else ss = ss.concat(t);
    }

    return ss;
}

function _getSimpleSelector() {
    if (checkNthselector(pos)) return getNthselector();
    else if (checkCombinator(pos)) return getCombinator();
    else if (checkAttrib(pos)) return getAttrib();
    else if (checkPseudo(pos)) return getPseudo();
    else if (checkClazz(pos)) return getClazz();
    else if (checkShash(pos)) return getShash();
    else if (checkAny(pos)) return getAny();
    else if (checkSC(pos)) return getSC();
    else if (checkNamespace(pos)) return getNamespace();
}

// node: String
function checkString(_i) {
    if (_i < tokens.length &&
        (tokens[_i].type === TokenType.StringSQ || tokens[_i].type === TokenType.StringDQ)
    ) return 1;

    return fail(tokens[_i]);
}

function getString() {
    var startPos = pos;

    return needInfo?
            [getInfo(startPos), NodeType.StringType, tokens[pos++].value] :
            [NodeType.StringType, tokens[pos++].value];
}

//stylesheet = (cdo | cdc | sc | statement)*:x -> this.concat([#stylesheet], x)
function checkStylesheet(_i) {
    var start = _i,
        l;

    while (_i < tokens.length) {
        if (l = checkSC(_i)) _i += l;
        else {
            currentBlockLN = tokens[_i].line;
            if (l = checkAtrule(_i)) _i += l;
            else if (l = checkRuleset(_i)) _i += l;
            else if (l = checkUnknown(_i)) _i += l;
            else throwError();
        }
    }

    return _i - start;
}

function getStylesheet() {
    var stylesheet = createToken(NodeType.StylesheetType);

    while (pos < tokens.length) {
        if (checkSC(pos)) stylesheet = stylesheet.concat(getSC());
        else {
            currentBlockLN = tokens[pos].line;
            if (checkRuleset(pos)) stylesheet.push(getRuleset());
            else if (checkAtrule(pos)) stylesheet.push(getAtrule());
            else if (checkUnknown(pos)) stylesheet.push(getUnknown());
            else throwError();
        }
    }

    return stylesheet;
}

//tset = vhash | any | sc | operator
function checkTset(_i) {
    return checkVhash(_i) ||
           checkAny(_i) ||
           checkSC(_i) ||
           checkOperator(_i);
}

function getTset() {
    if (checkVhash(pos)) return getVhash();
    else if (checkAny(pos)) return getAny();
    else if (checkSC(pos)) return getSC();
    else if (checkOperator(pos)) return getOperator();
}

function checkTsets(_i) {
    var start = _i,
        l;

    while (l = checkTset(_i)) {
        _i += l;
    }

    return _i - start;
}

function getTsets() {
    var tsets = [],
        x;

    while (x = getTset()) {
        if ((needInfo && typeof x[1] === 'string') || typeof x[0] === 'string') tsets.push(x);
        else tsets = tsets.concat(x);
    }

    return tsets;
}

// node: Unary
function checkUnary(_i) {
    if (_i < tokens.length &&
        (tokens[_i].type === TokenType.HyphenMinus ||
        tokens[_i].type === TokenType.PlusSign)
    ) return 1;

    return fail(tokens[_i]);
}

function getUnary() {
    var startPos = pos;

    return needInfo?
            [getInfo(startPos), NodeType.UnaryType, tokens[pos++].value] :
            [NodeType.UnaryType, tokens[pos++].value];
}

// node: Unknown
function checkUnknown(_i) {
    if (_i < tokens.length && tokens[_i].type === TokenType.CommentSL) return 1;

    return fail(tokens[_i]);
}

function getUnknown() {
    var startPos = pos;

    return needInfo?
            [getInfo(startPos), NodeType.UnknownType, tokens[pos++].value] :
            [NodeType.UnknownType, tokens[pos++].value];
}

//    uri = seq('url(') sc*:s0 string:x sc*:s1 ')' -> this.concat([#uri], s0, [x], s1)
//        | seq('url(') sc*:s0 (~')' ~m_w char)*:x sc*:s1 ')' -> this.concat([#uri], s0, [[#raw, x.join('')]], s1),
function checkUri(_i) {
    var start = _i;

    if (_i < tokens.length && tokens[_i++].value !== 'url') return fail(tokens[_i - 1]);

    if (!tokens[_i] || tokens[_i].type !== TokenType.LeftParenthesis) return fail(tokens[_i]);

    return tokens[_i].right - start + 1;
}

function getUri() {
    var startPos = pos;

    pos += 2;

    if (checkUri1(pos)) {
        var uri = (needInfo? [getInfo(startPos), NodeType.UriType] : [NodeType.UriType])
                    .concat(getSC())
                    .concat([getString()])
                    .concat(getSC());

        pos++;

        return uri;
    } else {
        var uri = (needInfo? [getInfo(startPos), NodeType.UriType] : [NodeType.UriType])
                    .concat(getSC()),
            l = checkExcluding(pos),
            raw = needInfo?
                    [getInfo(pos), NodeType.RawType, joinValues(pos, pos + l)] :
                    [NodeType.RawType, joinValues(pos, pos + l)];

        uri.push(raw);

        pos += l + 1;

        uri = uri.concat(getSC());

        pos++;

        return uri;
    }
}

function checkUri1(_i) {
    var start = _i,
        l = checkSC(_i);

    if (l) _i += l;

    if (tokens[_i].type !== TokenType.StringDQ && tokens[_i].type !== TokenType.StringSQ) return fail(tokens[_i]);

    _i++;

    if (l = checkSC(_i)) _i += l;

    return _i - start;
}

// value = (sc | vhash | any | block | atkeyword | operator | important)+:x -> this.concat([#value], x)
function checkValue(_i) {
    var start = _i,
        l;

    while (_i < tokens.length) {
        if (l = _checkValue(_i)) _i += l;
        else break;
    }

    if (_i - start) return _i - start;

    return fail(tokens[_i]);
}

function _checkValue(_i) {
    return checkSC(_i) ||
           checkVhash(_i) ||
           checkAny(_i) ||
           checkBlock(_i) ||
           checkAtkeyword(_i) ||
           checkOperator(_i) ||
           checkImportant(_i);
}

function getValue() {
    var ss = createToken(NodeType.ValueType);
    var t;

    while (pos < tokens.length && _checkValue(pos)) {
        t = _getValue();

        if ((needInfo && typeof t[1] === 'string') || typeof t[0] === 'string') ss.push(t);
        else ss = ss.concat(t);
    }

    return ss;
}

function _getValue() {
    if (checkSC(pos)) return getSC();
    else if (checkVhash(pos)) return getVhash();
    else if (checkAny(pos)) return getAny();
    else if (checkBlock(pos)) return getBlock();
    else if (checkAtkeyword(pos)) return getAtkeyword();
    else if (checkOperator(pos)) return getOperator();
    else if (checkImportant(pos)) return getImportant();
}

// node: Vhash
function checkVhash(_i) {
    if (_i >= tokens.length || tokens[_i].type !== TokenType.NumberSign) return fail(tokens[_i]);

    var l = checkNmName2(_i + 1);

    if (l) return l + 1;

    return fail(tokens[_i]);
}

function getVhash() {
    var startPos = pos;

    pos++;

    return needInfo?
            [getInfo(startPos), NodeType.VhashType, getNmName2()] :
            [NodeType.VhashType, getNmName2()];
}

function checkNmName(_i) {
    var start = _i;

    // start char / word
    if (tokens[_i].type === TokenType.HyphenMinus ||
        tokens[_i].type === TokenType.LowLine ||
        tokens[_i].type === TokenType.Identifier ||
        tokens[_i].type === TokenType.DecimalNumber) _i++;
    else return fail(tokens[_i]);

    for (; _i < tokens.length; _i++) {
        if (tokens[_i].type !== TokenType.HyphenMinus &&
            tokens[_i].type !== TokenType.LowLine &&
            tokens[_i].type !== TokenType.Identifier &&
            tokens[_i].type !== TokenType.DecimalNumber) break;
    }

    tokens[start].nm_name_last = _i - 1;

    return _i - start;
}

function getNmName() {
    var s = joinValues(pos, tokens[pos].nm_name_last);

    pos = tokens[pos].nm_name_last + 1;

    return s;
}

function checkNmName2(_i) {
    if (tokens[_i].type === TokenType.Identifier) return 1;
    else if (tokens[_i].type !== TokenType.DecimalNumber) return fail(tokens[_i]);

    _i++;

    if (!tokens[_i] || tokens[_i].type !== TokenType.Identifier) return 1;

    return 2;
}

function getNmName2() {
    var s = tokens[pos].value;

    if (tokens[pos++].type === TokenType.DecimalNumber &&
            pos < tokens.length &&
            tokens[pos].type === TokenType.Identifier
    ) s += tokens[pos++].value;

    return s;
}

function checkExcluding( _i) {
    var start = _i;

    while(_i < tokens.length) {
        var type = tokens[_i++].type;

        if (type === TokenType.Space ||
            type === TokenType.LeftParenthesis ||
            type === TokenType.RightParenthesis) {
            break;
        }
    }

    return _i - start - 2;
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

module.exports = function parse(source, rule, _needInfo) {
    tokens = tokenize(source);
    rule = rule || 'stylesheet';
    needInfo = _needInfo;
    pos = 0;
    failLN = 0;

    var ast = CSSPRules[rule]();
    //console.log(require('../utils/stringify.js')(require('../utils/cleanInfo.js')(ast), true));
    return ast;
};
