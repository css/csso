/*
 * TODO:
 * - different whitespace modes: selectors / inside (..) / blocks
 * - perhaps, it is needed to join normalize_x functions
 * - don't throw away comments?
 */

function scan(s) {
    var tokens = [],
        i,                 // current index
        j,                 // temporary index
        buf = '',          // token buffer
        cc,                // current char
        sl = s.length + 1; // original input length

    function push(token) {
        if (token || buf) tokens.push(token ? token : buf);
        buf = '';
    }

    function pushcc() {
        push(); push(cc);
    }

    s = s + '\n'; // normalized input

    for (i = 0; i < sl; i++) {
        cc = s.charAt(i);
        switch(cc) {
            case '/':
                push();
                if (s.charAt(i + 1) === '*') {
                    j = s.indexOf('*/', i + 1);
                    if (j !== -1) i = j + 1;
                    else i = sl;
                } else push(cc);
                break;
            case '"': case "'":
                j = indexOfQuote(s, cc, i + 1);
                if (j !== -1) {
                    j += 1;
                    push();
                    buf = s.substring(i, j).replace('\\\n', '');
                    push(buf.charAt(buf.length -1) === cc ? buf : buf + cc);
                    i = j - 1;
                }
                break;
            case '^': case '$': case '|': case '=': case '~': case '*':
            case '[': case ']': case '(': case ')': case '@': case '{':
            case '}': case ',': case '#': case '.': case '>': case '+':
            case ';': case '-': case ':':
                pushcc();
                break;
            case ' ': case '\n': case '\t': case '\r':
                if (buf && buf !== ' ') push();
                buf = ' ';
                break;
            default:
                if (buf === ' ') push();
                buf += cc;
                break;
        }
    }

    return tokens;
}

function indexOfQuote(s, q, pos) {
    var i = s.indexOf(q, pos),
        ni = s.indexOf('\n', pos);

    if (i === -1) return ni - 1; // ? see [CSS 2.1. / 4.2 Rules for handling parsing errors / Unexpected end of style sheet].
    if (ni < i && (s.charAt(ni - 1) !== '\\' || !oddEscapes(s, ni - 1))) {
        return ni - 1;
    } else {
        return oddEscapes(s, i - 1) ? indexOfQuote(s, q, i + 1) : i;
    }
}

function oddEscapes(s, pos) {
    var n = 0;

    for (; pos != -1; pos--) {
        if (s.charAt(pos) === '\\') n++;
        else break;
    }

    return 1 == (n & 1);
}

function maketree(tokens) {
    var root = { nodes: [] };

    for (var i = 0; i < tokens.length;) i = fillnode(root, tokens, i);

    return root;
}

function fillnode(node, tokens, i) {
    var bs,  // block start
        be,  // block end
        atr, // possible at-rule
        t;   // temp

    for (; i < tokens.length;) {
        if (tokens[i] === ' ') i++;
        else {
            bs = tokens.indexOf('{', i);
            be = tokens.indexOf('}', i);
            atr = tokens.indexOf(';', i);

            if (tokens[i] === '@' && atr !== -1 && ( // perhaps, 1-line atrule
                        (bs === -1 && be === -1) ||             // only this atrule left
                        (bs === -1 && be !== -1 && atr < be) || // @x; .. }
                        (bs !== -1 && be !== -1 && (
                                (be < bs && atr < be) ||        // @x; .. } .. {
                                (bs < be && atr < bs)           // @x; .. { .. }
                            )
                        )
                    )
               ) {
                t = { rvalue: trimtokens(tokens, i, atr), value: [], rcontent: [], content: [], nodes: [] };
                node.nodes.push(t);
                i = atr + 1;
            } else if (bs !== -1 && be > bs) {
                t = { rvalue: trimtokens(tokens, i, bs), value: [], rcontent: [], content: [], nodes: [] };
                node.nodes.push(t);
                i = fillnode(t, tokens, bs + 1);
            } else if (bs === -1 || be < bs) {
                node.rcontent = trimtokens(tokens, i, be);
                return be + 1;
            } else break;
        }
    }

    return tokens.length;
}

function trimtokens(tokens, start, end) {
    start = start || 0;
    end = end || tokens.length;

    return start === end ? [] :
           tokens.slice(tokens[start] === ' ' ? start + 1 : start,
                        tokens[end - 1] === ' ' ? end - 1 : end);
}

function normalize(nodes) {
    normalize_value(nodes);
    normalize_content(nodes);
    normalize_numbers(nodes);

    return nodes;
}

function normalize_value(nodes) {
    nodes.forEach(function(node) {
        var rv = node.rvalue, // raw value
            t = [],           // temp
            ct,               // current token
            nt,               // next token
            sb = false;       // inside '[]'

        if (rv[0] !== '@') {
            node.type = 'ruleset';

            // it looks like ruleset selectors
            for (var i = 0; i < rv.length; i++) {
                ct = rv[i];
                nt = rv[i + 1];
                if (ct !== ',') {
                    switch (ct) {
                        case '[':
                            sb = true;
                            break;
                        case ']':
                            sb = false;
                            break;
                        case '^': case '$': case '|': case '~': case '*':
                            ct = (sb && nt === '=') ? (i++, ct + '=') : ct;
                            break;
                        case ':':
                            ct = nt === ':' ? ct + ':' : ct;
                            break;
                    }

                    t.push(ct);
                } else if (t.length) {
                    node.value.push(cleanspaces(t));
                    t = [];
                }
            }
            if (t.length) node.value.push(cleanspaces(t));
        } else {
            node.type = 'atrule';
            node.value = cleanspaces(rv);
        }

        delete node.rvalue;

        if (node.nodes.length) normalize_value(node.nodes);
    });
}

function normalize_content(nodes) {
    nodes.forEach(function(node) {
        if (node.nodes.length) {
            normalize_content(node.nodes);
        } else {
            var rc = node.rcontent, // raw content
                j,                  // temp index
                d;                  // declaration

            for (var i = 0; i < rc.length;) {
                d = { name: null, value: [] };

                j = rc.indexOf(':', i); // find property name
                if (j !== -1) {
                    d.name = trimtokens(rc.slice(i, j)).join('');
                    i = j + 1;
                } else {
                    d.name = trimtokens(rc.slice(i, rc.length - 1)).join('');
                    break;
                }

                j = rc.indexOf(';', i); // find property value
                if (j !== -1) {
                    d.value = cleanspaces(rc.slice(i, j));
                    i = j + 1;
                } else {
                    d.value = cleanspaces(rc.slice(i, rc.length));
                    i = rc.length;
                }
                node.content.push(d);
            }
        }
        
        delete node.rcontent;
    });
}

function normalize_numbers(nodes) {
    nodes.forEach(function(node) {
        node.value.forEach(function(v) {
            _normalize_numbers(v);
        });
        node.content.forEach(function(d) {
            _normalize_numbers(d.value);
        });

        if (node.nodes.length) normalize_numbers(node.nodes);
    });
}

function _normalize_numbers(a) {
    var ct, nt, pt,
        renum = /^-?[0-9]+$/,
        cssnum = /^\d*([a-z]{2})?$/;

    for (var i = 0; i < a.length; i++) {
        pt = a[i - 1];
        ct = a[i];
        nt = a[i + 1];

        if (ct === '.') {
            if (cssnum.test(nt)) a.splice(i, 2, ct + nt);
            if (renum.test(pt)) a.splice(i - 1, 2, pt + a[i]), i--;
        }
    }
}

function cleanspaces(tokens) {
    var r = [];

    for (var i = 0; i < tokens.length; i++) {
        if (tokens[i] !== ' ' || !killspace(tokens, i)) r.push(tokens[i]);
    }

    return r;
}

function killspace(tokens, i) {
    var killers = ['[', ']', '(', ')', '>', '+', '-', '/', '=', '^=', '$=', '|=', '~=', '*=', ','];
    return (i === 0 || i === tokens.length -1) ||
           (killers.indexOf(tokens[i - 1]) !== -1) ||
           (killers.indexOf(tokens[i + 1]) !== -1);
}

exports.parse = function(s) {
    return normalize(maketree(scan(s)).nodes);
};
