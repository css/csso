/*
 * TODO:
 * - different whitespace modes: selectors / inside (..) / blocks
 * - perhaps, it is needed to join normalize_x functions
 * - don't throw away comments?
 * - class selectors and other selectors in the form of a\:b
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
    var bs,    // block start
        be,    // block end
        delim, // delim
        t;     // temp

    for (; i < tokens.length;) {
        if (tokens[i] === ' ') i++;
        else {
            bs = tokens.indexOf('{', i);
            be = tokens.indexOf('}', i);
            delim = tokens.indexOf(';', i);

            if (tokens[i] === '@' && // TODO: simplify this horror
                    ((delim !== -1 && ( // perhaps, 1-line atrule
                        (bs === -1 && be === -1) ||             // only this atrule left
                        (bs === -1 && be !== -1 && delim < be) || // @x; .. }
                        (bs !== -1 && be !== -1 && (
                                (be < bs && delim < be) ||        // @x; .. } .. {
                                (bs < be && delim < bs)           // @x; .. { .. }
                            )
                        )
                    )) || (delim === -1 && be === -1 && bs === -1))
               ) {
                if (delim === -1) delim = tokens.length;
                t = { rvalue: trimtokens(tokens, i, delim), value: [], rcontent: [], content: [], nodes: [] };
                node.nodes.push(t);
                i = delim + 1;
            } else if (bs !== -1 && be > bs) {
                t = { rvalue: trimtokens(tokens, i, bs), value: [], rcontent: [], content: [], nodes: [] };
                node.nodes.push(t);
                i = fillnode(t, tokens, bs + 1);
            } else if (bs === -1 && be !== -1 || be < bs) {
                node.rcontent = trimtokens(tokens, i, be);
                return be + 1;
            } else break;
        }
    }

    return tokens.length;
}

function trimtokens(tokens, start, end) {
    start = start || 0;
    end = end === undefined ? tokens.length : end;
    return start === end ? [] :
           tokens.slice(tokens[start] === ' ' ? start + 1 : start,
                        tokens[end - 1] === ' ' ? end - 1 : end);
}

function normalize(nodes) {
    normalize_value(nodes);
    normalize_content(nodes);
    normalize_numbers(nodes);

    return { nodes: nodes };
}

function normalize_value(nodes) {
    var stoptoken = { ' ': 1, ',': 1, '[': 1, ']': 1, '(': 1, ')': 1, '{': 1, '}': 1,
                      '.': 1, '#': 1, '|': 1, '~': 1, ':': 1, '$': 1, '>': 1, '=': 1,
                      '*': 1, '^': 1 };

    nodes.forEach(function(node) {
        var rv = node.rvalue, // raw value
            t = [],           // temp
            i,                // temp
            ct,               // current token
            nt,               // next token
            rb = 0,           // inside '()'
            sb = 0,           // inside '[]'
            ss = -1,          // selector start
            se = -1;          // selector end

        if (rv[0] !== '@') {
            node.type = 'ruleset';

            // it looks like ruleset selectors
            for (i = 0; i < rv.length + 1; i++) {
                ct = rv[i];
                nt = rv[i + 1];

                if (ct in stoptoken || ct === undefined) {
                    if (ss !== se || ss !== -1) {
                        t.push(rv.slice(ss, i).join(''));
                    }
                    ss = -1;
                    se = -1;
                } else {
                    if (ss === -1) ss = i;
                    se = i;
                    continue;
                }

                if (ct !== undefined) {
                    if (ct !== ',') {
                        switch (ct) {
                            case '[':
                                sb++;
                                break;
                            case ']':
                                sb--;
                                break;
                            case '(':
                                rb++;
                                break;
                            case ')':
                                rb--;
                                break;
                            case '^': case '$': case '|': case '~': case '*':
                                ct = (sb && nt === '=') ? (i++, ct + '=') : ct;
                                break;
                            case ':':
                                ct = nt === ':' ? (i++, ct + ':') : ct;
                                break;
                        }

                        t.push(ct);
                    } else if (t.length) {
                        node.value.push(cleanspaces(t));
                        t = [];
                    }
                }
            }
            if (t.length) node.value.push(cleanspaces(t));
        } else {
            node.type = 'atrule';
            node.value = cleanspaces(rv);
            i = node.value.indexOf(' ');
            i = i === -1 ? node.value.length - 1 : i;
            node.value.splice(1, i - 1, node.value.slice(1, i).join(''));
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

                d.important = false;
                j = d.value.length;
                if (j > 0 && d.value[j - 1] === '!important') {
                    d.value.length = d.value[j - 2] === ' ' ? j - 2 : j - 1;
                    d.important = true;
                } else if (j > 2 && d.value.slice(j - 3, j).join('') === '! important') {
                    d.value.length = d.value[j - 4] === ' ' ? j - 4 : j - 3;
                    d.important = true;
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
    var killers = ['[', ']', '(', ')', '>', '+', '-', '~', '/', '=', '^=', '$=', '|=', '~=', '*=', ','];
    return (i === 0 || i === tokens.length -1) ||
           (killers.indexOf(tokens[i - 1]) !== -1) ||
           (killers.indexOf(tokens[i + 1]) !== -1);
}

exports.parse = function(s) {
    return normalize(maketree(scan(s)).nodes);
};
