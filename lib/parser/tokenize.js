var TokenType = require('./const.js');
var pos;
var lineStartPos;
var ln;

var Punctuation = {
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
    return '0123456789'.indexOf(c) !== -1;
}

function tokenize(s) {
    function pushToken(type, ln, column, value) {
        tokens.push({
            type: type,
            value: value,

            offset: lastPos,
            line: ln,
            column: column
        });

        lastPos = pos;
    }

    if (!s) {
        return [];
    }

    var tokens = [];
    var urlMode = false;

    // ignore first char if it is byte order marker (UTF-8 BOM)
    pos = s.charCodeAt(0) === 0xFEFF ? 1 : 0;
    var lastPos = pos;
    ln = 1;
    lineStartPos = -1;

    var blockMode = 0;
    var c;
    var cn;
    var ident;

    for (; pos < s.length; pos++) {
        c = s.charAt(pos);
        cn = s.charAt(pos + 1);

        if (c === '/' && cn === '*') {
            pushToken(TokenType.CommentML, ln, pos - lineStartPos, parseMLComment(s));
        } else if (!urlMode && c === '/' && cn === '/') {
            if (blockMode > 0) {
                pushToken(TokenType.Identifier, ln, pos - lineStartPos, ident = parseIdentifier(s));
                urlMode = urlMode || ident === 'url';
            } else {
                pushToken(TokenType.CommentSL, ln, pos - lineStartPos, parseSLComment(s));
            }
        } else if (c === '"' || c === "'") {
            pushToken(c === '"' ? TokenType.StringDQ : TokenType.StringSQ, ln, pos - lineStartPos, parseString(s, c));
        } else if (c === ' ' || c === '\n' || c === '\r' || c === '\t' || c === '\f') {
            pushToken(TokenType.Space, ln, pos - lineStartPos, parseSpaces(s));
        } else if (c in Punctuation) {
            pushToken(Punctuation[c], ln, pos - lineStartPos, c);
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
            pushToken(TokenType.DecimalNumber, ln, pos - lineStartPos, parseDecimalNumber(s));
        } else {
            pushToken(TokenType.Identifier, ln, pos - lineStartPos, ident = parseIdentifier(s));
            urlMode = urlMode || ident === 'url';
        }
    }

    mark(tokens);

    return tokens;
}

function parseSpaces(s) {
    var start = pos;

    for (; pos < s.length; pos++) {
        var c = s.charAt(pos);
        // \n or \f
        if (c === '\n' || c === '\f') {
            ln++;
            lineStartPos = pos;
        // \r + optional \n
        } else if (c === '\r') {
            ln++;
            if (s.charAt(pos + 1) === '\n') {
                pos++;
            }
            lineStartPos = pos;
        } else if (c !== ' ' && c !== '\t') {
            break;
        }
    }

    pos--;
    return s.substring(start, pos + 1);
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

    return s.substring(start, pos + 1);
}

function parseSLComment(s) {
    var start = pos;

    for (pos = pos + 2; pos < s.length; pos++) {
        if (s.charAt(pos) === '\n' || s.charAt(pos) === '\r') {
            break;
        }
    }

    return s.substring(start, pos + 1);
}

function parseString(s, q) {
    var start = pos;
    var res = '';

    for (pos = pos + 1; pos < s.length; pos++) {
        if (s.charAt(pos) === '\\') {
            var next = s.charAt(pos + 1);
            // \n or \f
            if (next === '\n' || next === '\f') {
                res += s.substring(start, pos);
                start = pos + 2;
                pos++;
            // \r + optional \n
            } else if (next === '\r') {
                res += s.substring(start, pos);
                if (s.charAt(pos + 2) === '\n') {
                    pos++;
                }
                start = pos + 2;
                pos++;
            } else {
                pos++;
            }
        } else if (s.charAt(pos) === q) {
            break;
        }
    }

    return res + s.substring(start, pos + 1);
}

function parseDecimalNumber(s) {
    var start = pos;

    for (; pos < s.length; pos++) {
        if (!isDecimalDigit(s.charAt(pos))) {
            break;
        }
    }

    pos--;
    return s.substring(start, pos + 1);
}

function parseIdentifier(s) {
    var start = pos;

    while (s.charAt(pos) === '/') {
        pos++;
    }

    for (; pos < s.length; pos++) {
        var c = s.charAt(pos);
        if (c === '\\') {
            pos++;
        } else if (c in Punctuation && c !== '_') {
            break;
        }
    }

    pos--;

    return s.substring(start, pos + 1);
}

// ====================================
// second run
// ====================================

function mark(tokens) {
    var ps = []; // Parenthesis
    var sbs = []; // SquareBracket
    var cbs = []; // CurlyBracket

    for (var i = 0, t; i < tokens.length; i++) {
        t = tokens[i];
        switch (t.type) {
            case TokenType.LeftParenthesis:
                ps.push(i);
                break;
            case TokenType.RightParenthesis:
                if (ps.length) {
                    tokens[ps.pop()].right = i;
                }
                break;
            case TokenType.LeftSquareBracket:
                sbs.push(i);
                break;
            case TokenType.RightSquareBracket:
                if (sbs.length) {
                    tokens[sbs.pop()].right = i;
                }
                break;
            case TokenType.LeftCurlyBracket:
                cbs.push(i);
                break;
            case TokenType.RightCurlyBracket:
                if (cbs.length) {
                    tokens[cbs.pop()].right = i;
                }
                break;
        }
    }
}

module.exports = tokenize;
