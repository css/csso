/**
 * @namespace CSS парсер.
 */
var $cssp = {

    /**
     * Проверяет, является ли строка комментарием.
     *
     * @param {String} s строка для проверки
     *
     * @returns {Boolean} если комментарий, true, иначе false
     */
    isComment: function(s) {
        return s.length > 3 && s.substr(0, 2) === '/*' && s.slice(-2) === '*/';
    },

    /**
     * Разбирает входную строку на CSS-токены.
     *
     * @param {String} s строка для разбора
     *
     * @returns {String[]} CSS-токены
     */
    scan: function(s) {
        var tokens = [],
            i,                 // current index
            j,                 // temporary index
            buf = '',          // token buffer
            cc,                // current char
            rb = 0,            // brackets counter
            urlmode = false,   // inside 'url()'
            expmode = false,   // inside 'expression()'
            t,                 // temp
            sl = s.length + 1; // original input length

        function push(token) {
            if (!urlmode && !expmode) {
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
                    if (s.charAt(i + 1) === '*') {
                        push();
                        j = s.indexOf('*/', i + 1);
                        if (j !== -1) {
                            push(s.substring(i, j + 2));
                            i = j + 1;
                        } else {
                            push(s.substring(i, sl));
                            i = sl;
                        }
                    } else pushcc();
                    break;
                case '"': case "'":
                    j = $cssp.indexOfQuote(s, cc, i + 1);

                    if (j.invalid) push(), push(';');
                    else {
                        push();
                        t = s.substring(i, j.i + 1).replace('\\\n', '');
                        push(t.charAt(t.length - 1) === cc ? t : t + cc);
                    }
                    i = j.i;
                    break;
                case '(':
                    rb++;
                    t = buf;
                    pushcc();
                    if (!urlmode) urlmode = t === 'url';
                    if (!expmode) expmode = t === 'expression';
                    break;
                case ')':
                    rb--;
                    urlmode = false;
                    if (expmode && !rb) expmode = false;
                    pushcc();
                    break;
                case '^': case '$': case '|': case '=': case '~': case '*':
                case '[': case ']': case '@': case '{': case '}': case ',':
                case '#': case '.': case '>': case '+': case '-': case ':':
                case ';':
                    pushcc();
                    break;
                case ' ': case '\n': case '\t': case '\r':
                    if (!expmode && buf && buf !== ' ') push();
                    buf = (urlmode || expmode)? buf + cc : ' ';
                    break;
                default:
                    if (buf === ' ') push();
                    buf += cc;
                    break;
            }
        }

        return tokens;
    },

    /**
     * Ищет завершение текста в кавычках.
     *
     * @param {String} s строка, в которой находится текст в кавычках
     * @param {String} q символ кавычки (' или ")
     * @param {Number} pos позиция, с которой начинать поиск
     *
     * @returns {Object} объект со свойствами invalid (если текст не завершается кавычкой) и i (индекс завершающей кавычки)
     */
    indexOfQuote: function(s, q, pos) {
        var i = s.indexOf(q, pos),
            ni = s.indexOf('\n', pos);

        if (i === -1 || (ni < i && (s.charAt(ni - 1) !== '\\' || !$cssp.oddEscapes(s, ni - 1)))) {
            return { invalid: true, i: ni };
        } else {
            return $cssp.oddEscapes(s, i - 1) ? $cssp.indexOfQuote(s, q, i + 1) : { invalid: false, i : i };
        }
    },

    /**
     * Проверяет, является ли нечётным число экранирующих '\' в строке.
     *
     * @param {String} s строка для проверки
     * @param {Number} pos позиция, с которой начинать проверку (проверка начинается с последнего '\')
     *
     * @returns {Boolean} если нечётное, true, иначе false
     */
    oddEscapes: function(s, pos) {
        var n = 0;

        for (; pos != -1; pos--) {
            if (s.charAt(pos) === '\\') n++;
            else break;
        }

        return 1 == (n & 1);
    },

    /**
     * Преобразует массив токенов в дерево.
     *
     * @param {String[]} tokens токены для преобразования
     *
     * @returns {Object[]} массив "корневых узлов" дерева
     */
    maketree: function(tokens) {
        var root = { nodes: [] },
            special = $cssp.makeSpecialIndex(tokens),
            i;

        for (i = 0; i < tokens.length;) i = $cssp.fillnode(root, tokens, special, i);

        return root.nodes;
    },

    /**
     * Индексирует специальные символы (';', '{', '}', '[', ']', '(', ')') для ускорения поиска токенов в массиве токенов.
     *
     * @param {String[]} tokens токены для индексации
     *
     * @returns {Object} объект со свойствами s (содержит индексы спецсимволов в массиве токенов) и t (содержит индексы спецсимволов в массиве спецсимволов)
     */
    makeSpecialIndex: function(tokens) {
        var ispecial = [],
            itokens = [],
            i = 0,
            j = 0,
            special = { ';': 1, '{': 1, '}': 1, '[': 1, ']': 1, '(': 1, ')': 1 };

        for (; i < tokens.length; i++) {
            if (tokens[i] in special) ispecial.push(i), j++;
            itokens.push(j);
        }

        for (i = itokens.length - 1; i !== -1 && itokens[i] === j; i--) itokens[i] = -1;

        return { s: ispecial, t: itokens };
    },

    /**
     * Ищет токен в массиве токенов. Используется индекс специальных символов.
     *
     * @param {String[]} tokens токены, среди которых искать
     * @param {Object} special индекс специальных символов
     * @param {String} t токен для поиска
     * @param {Number} i позиция, с которой начинать поиск
     *
     * @returns {Number} если найден, индекс токена, иначе -1
     */
    indexOfSpecial: function(tokens, special, t, i) {
        var sb = 0, // []
            rb = 0, // ()
            br = 0, // {}
            j = special.t[i],
            sp;
        
        if (j === -1) return -1;
        
        for (; j < special.s.length; j++) {
            sp = tokens[special.s[j]];
            if (sp === t &&
                    (sb < 1 || (sb === 1 && t === ']')) &&
                    (rb < 1 || (rb === 1 && t === ')')) &&
                    (br < 1 || (br === 1 && t === '}'))) {
                return special.s[j];
            }
            switch (sp) {
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
                case '{':
                    br++;
                    break;
                case '}':
                    br--;
                    break;
            }
        }

        return -1;
    },

    /**
     * Ищет токен в массиве токенов.
     *
     * @param {String[]} tokens токены, среди которых искать
     * @param {String} t токен для поиска
     * @param {Number} i позиция, с которой начинать поиск
     *
     * @returns {Number} если найден, индекс токена, иначе -1
     */
    indexOfToken: function(tokens, t, i) {
        var sb = 0, // []
            rb = 0, // ()
            br = 0; // {}

        for (; i < tokens.length; i++) {
            if (tokens[i] === t &&
                    (sb < 1 || (sb === 1 && t === ']')) &&
                    (rb < 1 || (rb === 1 && t === ')')) &&
                    (br < 1 || (br === 1 && t === '}'))) {
                return i;
            }
            switch (tokens[i]) {
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
                case '{':
                    br++;
                    break;
                case '}':
                    br--;
                    break;
            }
        }

        return -1;
    },

    /**
     * Заполняет значениями переданный узел.
     *
     * @param {Object} node узел для заполнения
     * @param {String[]} tokens массиво токенов
     * @param {Object} special индекс специальных символов
     * @param {Number} i индекс, с которого искать токены для заполнения узла
     *
     * @returns {Number} индекс, на котором завершилось заполнение
     */
    fillnode: function(node, tokens, special, i) {
        var bs,    // block start
            be,    // block end
            delim, // delim
            comments = [],
            t;     // temp

        for (; i < tokens.length;) {
            if (tokens[i] === ' ') i++;
            else if ($cssp.isComment(tokens[i])) {
                comments.push(tokens[i]);
                i++;
            } else {
                if (tokens[i] === '}') return i + 1;

                bs = $cssp.indexOfSpecial(tokens, special, '{', i);
                be = $cssp.indexOfSpecial(tokens, special, '}', i);
                delim = $cssp.indexOfSpecial(tokens, special, ';', i);

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
                    if (comments.length) {
                        node.nodes = node.nodes.concat(comments);
                        comments = [];
                    }
                    t = { rvalue: $cssp.trimtokens(tokens, i, delim - 1), value: [], rcontent: [], content: [], nodes: [] };
                    node.nodes.push(t);
                    i = delim + 1;
                } else if (bs !== -1 && be > bs) {
                    if (comments.length) {
                        node.nodes = node.nodes.concat(comments);
                        comments = [];
                    }
                    t = { rvalue: $cssp.trimtokens(tokens, i, bs - 1), value: [], rcontent: [], content: [], nodes: [] };
                    node.nodes.push(t);
                    i = $cssp.fillnode(t, tokens, special, bs + 1);
                } else if ((bs === -1 && be !== -1) || be < bs) {
                    node.rcontent = $cssp.trimtokens(tokens, i, be - 1);
                    if (comments.length) node.rcontent = comments.concat(node.rcontent);
                    return be + 1;
                } else break;
            }
        }

        if (comments.length) node.nodes = node.nodes.concat(comments);

        return tokens.length;
    },

    /**
     * Копирует из массива токенов участок, удаляет из него начальные и концевые пробельные токены и возвращает результат.
     *
     * @param {String[]} tokens массив токенов
     * @param {Number} start начало участка
     * @param {Number} end конец участка
     *
     * @returns {String[]} участок токенов без начальных и концевых пробельных токенов
     */
    trimtokens: function(tokens, start, end) {
        start = start || 0;
        end = end === undefined ? tokens.length - 1 : end;

        for (;start < tokens.length && tokens[start] === ' '; start++);
        for (;end !== -1 && tokens[end] === ' '; end--);

        return start === end ?
                   (tokens[start] === ' ' ? [] : [tokens[start]]) :
                   (tokens.slice(start, end + 1));
    },

    /**
     * Уточняет и корректирует содержание узлов.
     *
     * @param {Object[]} nodes узлы для коррекции
     *
     * @returns TODO
     */
    normalize: function(nodes) {
        $cssp.normalizeValue(nodes);
        $cssp.normalizeContent(nodes);
        $cssp.normalizeNumbers(nodes);

        return { nodes: nodes };
    },

    /**
     * Уточняет и корректирует свойство value узлов.
     *
     * @param {Object[]} nodes узлы для коррекции
     */
    normalizeValue: function(nodes) {
        var stoptoken = { ' ': 1, ',': 1, '[': 1, ']': 1, '(': 1, ')': 1, '{': 1, '}': 1,
                          '.': 1, '#': 1, '|': 1, '~': 1, ':': 1, '$': 1, '>': 1, '=': 1,
                          '*': 1, '^': 1, '+': 1, '-': 0 },
            k = 0,
            node;

        for (; k < nodes.length; k++) {
            node = nodes[k];
            if (typeof node !== 'string') {
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
                                node.value.push($cssp.cleanSpaces(t));
                                t = [];
                            }
                        }
                    }
                    if (t.length) node.value.push($cssp.cleanSpaces(t));
                } else {
                    node.type = 'atrule';
                    node.value = (rv[1] === 'media' || rv[1] === 'import') ? $cssp.cleanCSS3Spaces(rv) : $cssp.cleanSpaces(rv);
                    i = $cssp.indexOfAny(node.value, stoptoken, 1);
                    i = i === -1 ? node.value.length - 1 : i - 1;
                    node.value.splice(1, i, node.value.slice(1, i + 1).join(''));
                }

                delete node.rvalue;

                if (node.nodes.length) $cssp.normalizeValue(node.nodes);
            }
        }
    },

    /**
     * Уточняет и корректирует свойство content узлов.
     *
     * @param {Object[]} nodes узлы для коррекции
     */
    normalizeContent: function(nodes) {
        for (var k = 0; k < nodes.length; k++) {
            node = nodes[k];
            if (typeof node !== 'string') {
                var rc = node.rcontent, // raw content
                    j, m,               // temp index
                    d;                  // declaration

                if (node.type === 'ruleset' && !node.rcontent.length) {
                    nodes.splice(k, 1);
                    k--;
                } else {
                    for (var i = 0; i < rc.length;) {
                        if (rc[i] === ' ') i++;
                        else if ($cssp.isComment(rc[i])) {
                            node.content.push(rc[i]);
                            i++;
                        } else {
                            d = { name: null, value: [] };

                            j = $cssp.indexOfToken(rc, ':', i); // find property name
                            m = $cssp.indexOfToken(rc, ';', i);
                            if (m > j || m === -1) {
                                if (j !== -1) {
                                    d.name = $cssp.joinExceptComments($cssp.trimtokens(rc.slice(i, j)));
                                    i = j + 1;
                                } else {
                                    d.name = $cssp.joinExceptComments($cssp.trimtokens(rc.slice(i, rc.length - 1)));
                                    break;
                                }

                                j = $cssp.indexOfToken(rc, ';', i); // find property value
                                if (j !== -1) {
                                    d.value = $cssp.cleanSpaces(rc.slice(i, j));
                                    i = j + 1;
                                } else {
                                    d.value = $cssp.cleanSpaces(rc.slice(i, rc.length));
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
                            } else i++;
                        }
                    }

                    delete node.rcontent;

                    if (node.nodes.length) $cssp.normalizeContent(node.nodes);
                }
            }
        }
    },

    /**
     * Сводит воедино части имени CSS-свойства. Если среди частей нет комментариев, результат будет состоять из одного элемента.
     *
     * @param {String[]} tokens части для сведения
     *
     * @returns {String[]} сведённые части
     */
    joinExceptComments: function(tokens) {
        var r = [], buf = '';

        tokens.forEach(function(t) {
            if ($cssp.isComment(t)) {
                if (buf.trim()) r.push(buf.trim()), buf = '';
                r.push(t);
            } else buf += t;
        });

        if (buf.trim()) r.push(buf.trim());

        return r;
    },

    /**
     * Уточняет и корректирует числовые токены узлов.
     *
     * @param {Object[]} nodes узлы для коррекции
     */
    normalizeNumbers: function(nodes) {
        function _normalizeNumbers(tokens) {
            var ct, nt, pt,
                renum = /^-?[0-9]+$/,
                cssnum = /^\d*([a-z]{2}|%)?$/;

            for (var i = 0; i < tokens.length; i++) {
                pt = tokens[i - 1];
                ct = tokens[i];
                nt = tokens[i + 1];

                if (ct === '.') {
                    if (cssnum.test(nt)) tokens.splice(i, 2, ct + nt);
                    if (renum.test(pt)) tokens.splice(i - 1, 2, pt + tokens[i]), i--;
                }
            }
        }

        nodes.forEach(function(node) {
            if (typeof node !== 'string') {
                if (node.type === 'ruleset') {
                    node.value.forEach(function(v) {
                        _normalizeNumbers(v);
                    });
                } else _normalizeNumbers(node.value);
                node.content.forEach(function(d) {
                    if (typeof d !== 'string') _normalizeNumbers(d.value);
                });

                if (node.nodes.length) $cssp.normalizeNumbers(node.nodes);
            }
        });
    },

    /**
     * Убирает ненужные пробелы в массиве токенов с учётом "CSS3 Media Queries. 3.1. Error Handling" .
     *
     * @param {String[]} tokens токены для обработки
     *
     * @returns {String[]} обработанный массив токенов
     */
    cleanCSS3Spaces: function(tokens) {
        var r = [];

        for (var i = 0; i < tokens.length; i++) {
            if (tokens[i] === 'and' && tokens[i + 1] === ' ') {
                r.push('and');
                r.push(' ');
            } else if (tokens[i] !== ' ' || !$cssp.killSpace(tokens, i)) r.push(tokens[i]);
        }

        return r;
    },

    /**
     * Убирает ненужные пробелы в массиве токенов.
     *
     * @param {String[]} tokens токены для обработки
     *
     * @returns {String[]} обработанный массив токенов
     */
    cleanSpaces: function(tokens) {
        var r = [];

        for (var i = 0; i < tokens.length; i++) {
            if (tokens[i] !== ' ' || !$cssp.killSpace(tokens, i)) r.push(tokens[i]);
        }

        return r;
    },

    /**
     * Решает, является ли нужным пробельный токен под индексом.
     *
     * @param {String[]} tokens массив токенов
     * @param {Number} i индекс пробельного токена
     *
     * @returns {Boolean} если пробел не нужен, true, иначе false
     */
    killSpace: function(tokens, i) {
        var killers = ['[', ']', '(', ')', '>', '+', '-', '~', '/', '=', '^=', '$=', '|=', '~=', '*=', ','];
        return (i === 0 || i === tokens.length -1) ||
               (killers.indexOf(tokens[i - 1]) !== -1) ||
               (killers.indexOf(tokens[i + 1]) !== -1);
    },

    /**
     * Ищет символьный токен из набора в массиве токенов.
     *
     * @param {String[]} tokens массив токенов
     * @param {Object} chars набор символьных токенов
     * @param {Number} i индекс, с которого начинать поиск
     *
     * @returns {Number} если найден, индекс токена, иначе -1
     */
    indexOfAny: function(tokens, chars, i) {
        for (; i < tokens.length; i++) if (chars[tokens[i]] || $cssp.isComment(tokens[i])) return i;
        return -1;
    },

    /**
     * Разбирает строку с CSS-текстом в дерево.
     *
     * @param {String} s строка для разбора
     *
     * @returns TODO
     */
    parse: function(s) {
        return $cssp.normalize($cssp.maketree($cssp.scan(s)));
    }
};

if (typeof window === 'undefined') {
    exports.parse = $cssp.parse;
}
