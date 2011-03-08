/*
 * TODO:
 * - different whitespace modes: selectors / inside (..) / blocks
 * - perhaps, it is needed to join normalize_x functions
 * - don't throw away comments?
 * - class selectors and other selectors in the form of a\:b
 */

var $cssp = {

    scan: function(s) {
        var tokens = [],
            i,                 // current index
            j,                 // temporary index
            buf = '',          // token buffer
            cc,                // current char
            urlmode = false,   // inside 'url()'
            t,                 // temp
            sl = s.length + 1; // original input length

        function push(token) {
            if (!urlmode) {
                if (token || buf) tokens.push(token ? token : buf);
                buf = '';
            } else if (token) buf += token;
        }

        function pushcc() {
            push(); push(cc);
        }

        s = s + '\n'; // normalized input

        for (i = 0; i < sl; i++) {
            cc = s.charAt(i);
            switch(cc) {
                case '\\':
                    if (buf === ' ') push();
                    buf += cc;
                    if (i < sl - 1) {
                        i++;
                        buf += s.charAt(i);
                    }
                    break;
                case '/':
                    push();
                    if (s.charAt(i + 1) === '*') {
                        j = s.indexOf('*/', i + 1);
                        if (j !== -1) i = j + 1;
                        else i = sl;
                    } else push(cc);
                    break;
                case '"': case "'":
                    j = $cssp.indexOfQuote(s, cc, i + 1);
                    if (j !== -1) {
                        j += 1;
                        push();
                        t = s.substring(i, j).replace('\\\n', '');
                        push(t.charAt(t.length -1) === cc ? t : t + cc);
                        i = j - 1;
                    }
                    break;
                case '(':
                    t = buf;
                    pushcc();
                    urlmode = t === 'url';
                    break;
                case ')':
                    urlmode = false;
                    pushcc();
                    break;
                case '^': case '$': case '|': case '=': case '~': case '*':
                case '[': case ']': case '@': case '{': case '}': case ',':
                case '#': case '.': case '>': case '+': case ';': case '-':
                case ':':
                    pushcc();
                    break;
                case ' ': case '\n': case '\t': case '\r':
                    if (buf && buf !== ' ') push();
                    buf = urlmode? buf + ' ' : ' ';
                    break;
                default:
                    if (buf === ' ') push();
                    buf += cc;
                    break;
            }
        }

        return tokens;
    },

    indexOfQuote: function(s, q, pos) {
        var i = s.indexOf(q, pos),
            ni = s.indexOf('\n', pos);

        if (i === -1) return ni - 1; // ? see [CSS 2.1. / 4.2 Rules for handling parsing errors / Unexpected end of style sheet].
        if (ni < i && (s.charAt(ni - 1) !== '\\' || !$cssp.oddEscapes(s, ni - 1))) {
            return ni - 1;
        } else {
            return $cssp.oddEscapes(s, i - 1) ? $cssp.indexOfQuote(s, q, i + 1) : i;
        }
    },

    oddEscapes: function(s, pos) {
        var n = 0;

        for (; pos != -1; pos--) {
            if (s.charAt(pos) === '\\') n++;
            else break;
        }

        return 1 == (n & 1);
    },

    maketree: function(tokens) {
        var root = { nodes: [] };

        for (var i = 0; i < tokens.length;) i = $cssp.fillnode(root, tokens, i);

        return root;
    },

    fillnode: function(node, tokens, i) {
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
                    if (tokens[i + 1] !== 'charset' || (tokens[i + 1] === 'charset' && i === 0)) {
                        if (delim === -1) delim = tokens.length;
                        t = { rvalue: $cssp.trimtokens(tokens, i, delim), value: [], rcontent: [], content: [], nodes: [] };
                        node.nodes.push(t);
                    }
                    i = delim + 1;
                } else if (bs !== -1 && be > bs) {
                    t = { rvalue: $cssp.trimtokens(tokens, i, bs), value: [], rcontent: [], content: [], nodes: [] };
                    node.nodes.push(t);
                    i = $cssp.fillnode(t, tokens, bs + 1);
                } else if (bs === -1 && be !== -1 || be < bs) {
                    node.rcontent = $cssp.trimtokens(tokens, i, be);
                    return be + 1;
                } else break;
            }
        }

        return tokens.length;
    },

    trimtokens: function(tokens, start, end) {
        start = start || 0;
        end = end === undefined ? tokens.length : end;
        return start === end ? [] :
               tokens.slice(tokens[start] === ' ' ? start + 1 : start,
                            tokens[end - 1] === ' ' ? end - 1 : end);
    },

    normalize: function(nodes) {
        $cssp.normalize_value(nodes);
        $cssp.normalize_content(nodes);
        $cssp.normalize_numbers(nodes);

        return { nodes: nodes };
    },

    normalize_value: function(nodes) {
        var stoptoken = { ' ': 1, ',': 1, '[': 1, ']': 1, '(': 1, ')': 1, '{': 1, '}': 1,
                          '.': 1, '#': 1, '|': 1, '~': 1, ':': 1, '$': 1, '>': 1, '=': 1,
                          '*': 1, '^': 1, '+': 1, '-': 0 };

        nodes.forEach(function(node) {
            var rv = node.rvalue, // raw value
                t = [],           // temp
                i,                // temp
                ct,               // current token
                nt,               // next token
                cnot = 0,         // 'not' pseudo-class mode
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

                    if (ct === 'not' && nt === '(') cnot = 1;

                    if (stoptoken[ct] || ct === undefined) {
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
                                    if (!cnot) stoptoken['-'] = 1;
                                    break;
                                case ')':
                                    rb--;
                                    if (!rb) {
                                        stoptoken['-'] = 0;
                                        cnot = 0;
                                    }
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
                            node.value.push($cssp.cleanspaces(t));
                            t = [];
                        }
                    }
                }
                if (t.length) node.value.push($cssp.cleanspaces(t));
            } else {
                node.type = 'atrule';
                node.value = $cssp.cleanspaces(rv);
                i = $cssp.indexOfAny(node.value, stoptoken, 1);
                i = i === -1 ? node.value.length - 1 : i - 1;
                node.value.splice(1, i, node.value.slice(1, i + 1).join(''));
            }

            delete node.rvalue;

            if (node.nodes.length) $cssp.normalize_value(node.nodes);
        });
    },

    normalize_content: function(nodes) {
        nodes.forEach(function(node) {
            if (node.nodes.length) {
                $cssp.normalize_content(node.nodes);
            } else {
                var rc = node.rcontent, // raw content
                    j,                  // temp index
                    d;                  // declaration

                for (var i = 0; i < rc.length;) {
                    d = { name: null, value: [] };

                    j = rc.indexOf(':', i); // find property name
                    if (j !== -1) {
                        d.name = $cssp.trimtokens(rc.slice(i, j)).join('');
                        i = j + 1;
                    } else {
                        d.name = $cssp.trimtokens(rc.slice(i, rc.length - 1)).join('');
                        break;
                    }

                    j = rc.indexOf(';', i); // find property value
                    if (j !== -1) {
                        d.value = $cssp.cleanspaces(rc.slice(i, j));
                        i = j + 1;
                    } else {
                        d.value = $cssp.cleanspaces(rc.slice(i, rc.length));
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
    },

    normalize_numbers: function(nodes) {
        nodes.forEach(function(node) {
            if (node.type === 'ruleset') {
                node.value.forEach(function(v) {
                    $cssp._normalize_numbers(v);
                });
            } else $cssp._normalize_numbers(node.value);
            node.content.forEach(function(d) {
                $cssp._normalize_numbers(d.value);
            });

            if (node.nodes.length) $cssp.normalize_numbers(node.nodes);
        });
    },

    _normalize_numbers: function(a) {
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
    },

    cleanspaces: function(tokens) {
        var r = [];

        for (var i = 0; i < tokens.length; i++) {
            if (tokens[i] !== ' ' || !$cssp.killspace(tokens, i)) r.push(tokens[i]);
        }

        return r;
    },

    killspace: function(tokens, i) {
        var killers = ['[', ']', '(', ')', '>', '+', '-', '~', '/', '=', '^=', '$=', '|=', '~=', '*=', ','];
        return (i === 0 || i === tokens.length -1) ||
               (killers.indexOf(tokens[i - 1]) !== -1) ||
               (killers.indexOf(tokens[i + 1]) !== -1);
    },

    indexOfAny: function(a, chars, i) {
        for (; i < a.length; i++) if (chars[a[i]]) return i;
        return -1;
    },

    parse: function(s) {
        return $cssp.normalize($cssp.maketree($cssp.scan(s)).nodes);
    }
};

if (typeof window === 'undefined') {
    exports.parse = $cssp.parse;
}
