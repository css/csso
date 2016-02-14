'use strict';

var TokenType = require('./const.js');
var unicodeRx = /^[0-9a-f]{1,6}(\r\n|[ \n\r\t\f])?/g;
var lineStartPos;
var line;
var pos;

var TAB = 9;
var N = 10;
var F = 12;
var R = 13;
var SPACE = 32;
var DOUBLE_QUOTE = 34;
var QUOTE = 39;
var RIGHT_PARENTHESIS = 41;
var STAR = 42;
var SLASH = 47;
var BACK_SLASH = 92;
var UNDERSCORE = 95;
var LEFT_CURLY_BRACE = 123;
var RIGHT_CURLY_BRACE = 125;

var PUNCTUATION = {
    9:  TokenType.Tab,                // '\t'
    10: TokenType.Newline,            // '\n'
    13: TokenType.Newline,            // '\r'
    32: TokenType.Space,              // ' '
    33: TokenType.ExclamationMark,    // '!'
    34: TokenType.QuotationMark,      // '"'
    35: TokenType.NumberSign,         // '#'
    36: TokenType.DollarSign,         // '$'
    37: TokenType.PercentSign,        // '%'
    38: TokenType.Ampersand,          // '&'
    39: TokenType.Apostrophe,         // '\''
    40: TokenType.LeftParenthesis,    // '('
    41: TokenType.RightParenthesis,   // ')'
    42: TokenType.Asterisk,           // '*'
    43: TokenType.PlusSign,           // '+'
    44: TokenType.Comma,              // ','
    45: TokenType.HyphenMinus,        // '-'
    46: TokenType.FullStop,           // '.'
    47: TokenType.Solidus,            // '/'
    58: TokenType.Colon,              // ':'
    59: TokenType.Semicolon,          // ';'
    60: TokenType.LessThanSign,       // '<'
    61: TokenType.EqualsSign,         // '='
    62: TokenType.GreaterThanSign,    // '>'
    63: TokenType.QuestionMark,       // '?'
    64: TokenType.CommercialAt,       // '@'
    91: TokenType.LeftSquareBracket,  // '['
    93: TokenType.RightSquareBracket, // ']'
    94: TokenType.CircumflexAccent,   // '^'
    95: TokenType.LowLine,            // '_'
    123: TokenType.LeftCurlyBracket,  // '{'
    124: TokenType.VerticalLine,      // '|'
    125: TokenType.RightCurlyBracket, // '}'
    126: TokenType.Tilde              // '~'
};
var MAX_PUNCTUATION_CODE = Math.max.apply(null, Object.keys(PUNCTUATION));
var IS_PUNCTUATION = Object.keys(PUNCTUATION).reduce(function(map, key) {
    map[Number(key)] = 1;
    return map;
}, new Uint32Array(MAX_PUNCTUATION_CODE + 1));

function isDecimalDigit(code) {
    return code >= 48 &&  // 0
           code <= 57;    // 9
}

function isPuctuation(code) {
    return code <= MAX_PUNCTUATION_CODE && IS_PUNCTUATION[code] === 1;
}

function tokenize(source) {
    function pushToken(type, line, column, value) {
        tokens.push({
            type: type,
            value: value,

            offset: lastPos,
            line: line,
            column: column
        });

        lastPos = pos;
    }

    if (!source) {
        return [];
    }

    var tokens = [];
    var urlMode = false;
    var lastPos = 0;
    var blockMode = 0;
    var code;
    var next;
    var ident;

    // ignore first char if it is byte order marker (UTF-8 BOM)
    pos = source.charCodeAt(0) === 0xFEFF ? 1 : 0;
    lastPos = pos;
    line = 1;
    lineStartPos = -1;

    for (; pos < source.length; pos++) {
        code = source.charCodeAt(pos);
        next = source.charCodeAt(pos + 1);

        if (code === SLASH) {
            if (next === STAR) { // /*
                pushToken(TokenType.CommentML, line, pos - lineStartPos, parseMLComment(source));
                continue;
            } else if (!urlMode && next === SLASH) { // //
                if (blockMode > 0) {
                    pushToken(TokenType.Identifier, line, pos - lineStartPos, ident = parseIdentifier(source));
                    urlMode = urlMode || ident === 'url';
                } else {
                    pushToken(TokenType.CommentSL, line, pos - lineStartPos, parseSLComment(source));
                }
                continue;
            }
        }

        if (isDecimalDigit(code)) {
            pushToken(TokenType.DecimalNumber, line, pos - lineStartPos, parseDecimalNumber(source));
        } else if (code === QUOTE) {
            pushToken(TokenType.StringSQ, line, pos - lineStartPos, parseString(source, code));
        } else if (code === DOUBLE_QUOTE) {
            pushToken(TokenType.StringDQ, line, pos - lineStartPos, parseString(source, code));
        } else if (code === SPACE || code === N || code === R || code === TAB || code === F) {
            pushToken(TokenType.Space, line, pos - lineStartPos, parseSpaces(source));
        } else if (isPuctuation(code)) {
            pushToken(PUNCTUATION[code], line, pos - lineStartPos, String.fromCharCode(code));
            if (code === RIGHT_PARENTHESIS) {
                urlMode = false;
            } else if (code === LEFT_CURLY_BRACE) {
                blockMode++;
            } if (code === RIGHT_CURLY_BRACE) {
                blockMode--;
            }
        } else {
            pushToken(TokenType.Identifier, line, pos - lineStartPos, ident = parseIdentifier(source));
            urlMode = urlMode || ident === 'url';
        }
    }

    mark(tokens);

    return tokens;
}

function parseSpaces(s) {
    var start = pos;

    for (; pos < s.length; pos++) {
        var code = s.charCodeAt(pos);
        // \n or \f
        if (code === N || code === F) {
            line++;
            lineStartPos = pos;
        // \r + optional \n
        } else if (code === R) {
            line++;
            if (s.charCodeAt(pos + 1) === N) {
                pos++;
            }
            lineStartPos = pos;
        } else if (code !== SPACE && code !== TAB) {
            break;
        }
    }

    pos--;
    return s.substring(start, pos + 1);
}

function parseMLComment(s) {
    var start = pos;

    for (pos += 2; pos < s.length; pos++) {
        var code = s.charCodeAt(pos);
        if (code === STAR) { // */
            if (s.charCodeAt(pos + 1) === SLASH) {
                pos++;
                break;
            }
        } else if (code === N || code === F) { // \n or \f
            line++;
            lineStartPos = pos;
        } else if (code === R) { // \r + optional \n
            line++;
            if (s.charCodeAt(pos + 1) === N) {
                pos++;
            }
            lineStartPos = pos;
        }
    }

    return s.substring(start, pos + 1);
}

function parseSLComment(s) {
    var start = pos;

    for (pos += 2; pos < s.length; pos++) {
        if (s.charCodeAt(pos) === N || s.charCodeAt(pos) === R) {
            break;
        }
    }

    return s.substring(start, pos + 1);
}

function parseString(s, quote) {
    var start = pos;
    var res = '';

    for (pos = pos + 1; pos < s.length; pos++) {
        var code = s.charCodeAt(pos);
        if (code === BACK_SLASH) {
            var next = s.charCodeAt(pos + 1);
            // \n or \f
            if (next === N || next === F) {
                res += s.substring(start, pos);
                start = pos + 2;
                pos++;
            // \r + optional \n
            } else if (next === R) {
                res += s.substring(start, pos);
                if (s.charCodeAt(pos + 2) === N) {
                    pos++;
                }
                start = pos + 2;
                pos++;
            } else {
                pos++;
            }
        } else if (code === quote) {
            break;
        }
    }

    return res + s.substring(start, pos + 1);
}

function parseDecimalNumber(s) {
    var start = pos;

    for (pos++; pos < s.length; pos++) {
        if (!isDecimalDigit(s.charCodeAt(pos))) {
            break;
        }
    }

    pos--;
    return s.substring(start, pos + 1);
}

function parseIdentifier(s) {
    var start = pos;
    var unicode;

    while (s.charCodeAt(pos) === SLASH) {
        pos++;
    }

    for (; pos < s.length; pos++) {
        var code = s.charCodeAt(pos);
        if (code === BACK_SLASH) {
            pos++;

            // skip complete unicode sequence that can ends with space
            unicode = s.substr(pos, 8).match(unicodeRx);
            if (unicode) {
                pos += unicode[0].length - 1;
            }
        } else if (isPuctuation(code) && code !== UNDERSCORE) {
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
    var ps = [];  // Parenthesis
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
