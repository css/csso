var TokenType = require('./const.js');
var Punctuation;
var urlMode;
var source;
var tokens;
var pos;
var lastPos;
var lineStartPos;
var ln;

Punctuation = {
    ' ': TokenType.Space,
    '\n': TokenType.Newline,
    '\r': TokenType.Newline,
    '\t': TokenType.Tab,
    '!': TokenType.ExclamationMark,
    '"': TokenType.QuotationMark,
    '#': TokenType.NumberSign,
    '$': TokenType.DollarSign,
    '%': TokenType.PercentSign,
    '&': TokenType.Ampersand,
    '\'': TokenType.Apostrophe,
    '(': TokenType.LeftParenthesis,
    ')': TokenType.RightParenthesis,
    '*': TokenType.Asterisk,
    '+': TokenType.PlusSign,
    ',': TokenType.Comma,
    '-': TokenType.HyphenMinus,
    '.': TokenType.FullStop,
    '/': TokenType.Solidus,
    ':': TokenType.Colon,
    ';': TokenType.Semicolon,
    '<': TokenType.LessThanSign,
    '=': TokenType.EqualsSign,
    '>': TokenType.GreaterThanSign,
    '?': TokenType.QuestionMark,
    '@': TokenType.CommercialAt,
    '[': TokenType.LeftSquareBracket,
    ']': TokenType.RightSquareBracket,
    '^': TokenType.CircumflexAccent,
    '_': TokenType.LowLine,
    '{': TokenType.LeftCurlyBracket,
    '|': TokenType.VerticalLine,
    '}': TokenType.RightCurlyBracket,
    '~': TokenType.Tilde
};

function isDecimalDigit(c) {
    return '0123456789'.indexOf(c) >= 0;
}

function tokenize(s) {
    if (!s) {
        return [];
    }

    source = s;
    tokens = [];
    ln = 1;
    urlMode = false;

    // ignore first char if it is byte order marker (UTF-8 BOM)
    pos = s.charCodeAt(0) === 0xFEFF ? 1 : 0;
    lastPos = pos;
    lineStartPos = 0;

    var blockMode = 0;
    var c;
    var cn;

    for (; pos < s.length; pos++) {
        c = s.charAt(pos);
        cn = s.charAt(pos + 1);

        if (c === '/' && cn === '*') {
            parseMLComment(s);
        } else if (!urlMode && c === '/' && s.substr(pos + 1, 5) === 'deep/') {
            pushToken(TokenType.Deep, '/deep/');
            pos += 5;
        } else if (!urlMode && c === '/' && cn === '/') {
            if (blockMode > 0) {
                parseIdentifier(s);
            } else {
                parseSLComment(s);
            }
        } else if (c === '"' || c === "'") {
            parseString(s, c);
        } else if (c === ' ') {
            parseSpaces(s);
        } else if (c in Punctuation) {
            pushToken(Punctuation[c], c);
            if (c === '\n') {
                ln++;
                lineStartPos = pos;
            }
            if (c === ')') {
                urlMode = false;
            }
            if (c === '{') {
                blockMode++;
            }
            if (c === '}') {
                blockMode--;
            }
        } else if (isDecimalDigit(c)) {
            parseDecimalNumber(s);
        } else {
            parseIdentifier(s);
        }
    }

    mark();

    return tokens;
}

function pushToken(type, value) {
    tokens.push({
        type: type,
        value: value,

        offset: lastPos,
        line: ln,
        column: lastPos - lineStartPos
    });

    lastPos += value.length;
}

function parseSpaces(s) {
    var start = pos;

    for (; pos < s.length; pos++) {
        if (s.charAt(pos) !== ' ') {
            break;
        }
    }

    pushToken(TokenType.Space, s.substring(start, pos));
    pos--;
}

function parseMLComment(s) {
    var start = pos;

    for (pos = pos + 2; pos < s.length; pos++) {
        if (s.charAt(pos) === '*') {
            if (s.charAt(pos + 1) === '/') {
                pos++;
                break;
            }
        }
        if (s.charAt(pos) === '\n') {
            ln++;
            lineStartPos = pos;
        }
    }

    pushToken(TokenType.CommentML, s.substring(start, pos + 1));
}

function parseSLComment(s) {
    var start = pos;

    for (pos = pos + 2; pos < s.length; pos++) {
        if (s.charAt(pos) === '\n' || s.charAt(pos) === '\r') {
            pos++;
            break;
        }
    }

    pushToken(TokenType.CommentSL, s.substring(start, pos));
    pos--;
}

function parseString(s, q) {
    var start = pos;

    for (pos = pos + 1; pos < s.length; pos++) {
        if (s.charAt(pos) === '\\') {
            pos++;
        } else if (s.charAt(pos) === q) {
            break;
        }
    }

    pushToken(q === '"' ? TokenType.StringDQ : TokenType.StringSQ, s.substring(start, pos + 1));
}

function parseDecimalNumber(s) {
    var start = pos;

    for (; pos < s.length; pos++) {
        if (!isDecimalDigit(s.charAt(pos))) {
            break;
        }
    }

    pushToken(TokenType.DecimalNumber, s.substring(start, pos));
    pos--;
}

function parseIdentifier(s) {
    var start = pos;

    while (s.charAt(pos) === '/') {
        pos++;
    }

    for (; pos < s.length; pos++) {
        if (s.charAt(pos) === '\\') {
            pos++;
        } else if (s.charAt(pos) in Punctuation) {
            break;
        }
    }

    var ident = s.substring(start, pos);

    urlMode = urlMode || ident === 'url';

    pushToken(TokenType.Identifier, ident);
    pos--;
}

// ====================================
// second run
// ====================================

function mark() {
    var ps = []; // Parenthesis
    var sbs = []; // SquareBracket
    var cbs = []; // CurlyBracket
    var t;

    for (var i = 0; i < tokens.length; i++) {
        t = tokens[i];
        switch (t.type) {
            case TokenType.LeftParenthesis:
                ps.push(i);
                break;
            case TokenType.RightParenthesis:
                if (ps.length) {
                    t.left = ps.pop();
                    tokens[t.left].right = i;
                }
                break;
            case TokenType.LeftSquareBracket:
                sbs.push(i);
                break;
            case TokenType.RightSquareBracket:
                if (sbs.length) {
                    t.left = sbs.pop();
                    tokens[t.left].right = i;
                }
                break;
            case TokenType.LeftCurlyBracket:
                cbs.push(i);
                break;
            case TokenType.RightCurlyBracket:
                if (cbs.length) {
                    t.left = cbs.pop();
                    tokens[t.left].right = i;
                }
                break;
        }
    }
}

module.exports = tokenize;
