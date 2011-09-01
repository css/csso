function CSSOCompressor() {}

CSSOCompressor.prototype.init = function() {
    this.props = {};
    this.ccrules = {}; // clean comment rules — special case to resolve ambiguity
    this.crules = {}; // compress rules
    this.prules = {}; // prepare rules
    this.rbrules = {}; // restructure block rules
    this.rjrules = {}; // rejoin ruleset rules
    this.rrrules = {}; // restructure ruleset rules
    this.frules = {}; // finalize rules

    this.initRules(this.crules, this.defCCfg);
    this.initRules(this.ccrules, this.cleanCfg);
    this.initRules(this.prules, this.preCfg);
    this.initRules(this.rbrules, this.defRBCfg);
    this.initRules(this.rjrules, this.defRJCfg);
    this.initRules(this.rrrules, this.defRRCfg);
    this.initRules(this.frules, this.defFCfg);
};

CSSOCompressor.prototype.initRules = function(r, cfg) {
    var o = this.order,
        p = this.profile,
        x, i, k,
        t = [];

    for (i = 0; i < o.length; i++) if (o[i] in cfg) t.push(o[i]);

    if (!t.length) t = o;
    for (i = 0; i < t.length; i++) {
        x = p[t[i]];
        for (k in x) r[k] ? r[k].push(t[i]) : r[k] = [t[i]];
    }
};

CSSOCompressor.prototype.cleanCfg = {
    'cleanComment': 1
};

CSSOCompressor.prototype.defCCfg = {
    'cleanCharset': 1,
    'cleanImport': 1,
    'cleanWhitespace': 1,
    'cleanDecldelim': 1,
    'compressNumber': 1,
    'compressColor': 1,
    'compressDimension': 1,
    'compressString': 1,
    'compressFontWeight': 1,
    'cleanEmptyBlock': 1
};

CSSOCompressor.prototype.defRBCfg = {
    'restructureBlock': 1
};

CSSOCompressor.prototype.defRJCfg = {
    'rejoinRuleset': 1,
    'cleanEmptyBlock': 1
};

CSSOCompressor.prototype.defRRCfg = {
    'restructureRuleset': 1,
    'cleanEmptyBlock': 1
};

CSSOCompressor.prototype.defFCfg = {
    'cleanEmptyBlock': 1,
    'delimSelectors': 1,
    'delimBlocks': 1
};

CSSOCompressor.prototype.preCfg = {
    'destroyDelims': 1,
    'preTranslate': 1
};

CSSOCompressor.prototype.order = [
    'cleanCharset',
    'cleanImport',
    'cleanComment',
    'cleanWhitespace',
    'compressNumber',
    'compressColor',
    'compressDimension',
    'compressString',
    'compressFontWeight',
    'destroyDelims',
    'preTranslate',
    'restructureBlock',
    'rejoinRuleset',
    'restructureRuleset',
    'cleanEmptyBlock',
    'delimSelectors',
    'delimBlocks'
];

CSSOCompressor.prototype.profile = {
    'cleanCharset': {
        'atrules': 1
    },
    'cleanImport': {
        'atrules': 1
    },
    'cleanWhitespace': {
        's': 1
    },
    'compressNumber': {
        'number': 1
    },
    'compressColor': {
        'vhash': 1,
        'funktion': 1,
        'ident': 1
    },
    'compressDimension': {
        'dimension': 1
    },
    'compressString': {
        'string': 1
    },
    'compressFontWeight': {
        'declaration': 1
    },
    'cleanComment': {
        'comment': 1
    },
    'cleanDecldelim': {
        'block': 1
    },
    'cleanEmptyBlock': {
        'ruleset': 1
    },
    'destroyDelims': {
        'decldelim': 1,
        'delim': 1
    },
    'preTranslate': {
        'declaration': 1,
        'property': 1,
        'simpleselector': 1
    },
    'restructureBlock': {
        'block': 1
    },
    'rejoinRuleset': {
        'ruleset': 1
    },
    'restructureRuleset': {
        'ruleset': 1
    },
    'delimSelectors': {
        'selector': 1
    },
    'delimBlocks': {
        'block': 1
    }
};

CSSOCompressor.prototype.isContainer = function(o) {
    if (Array.isArray(o)) {
        for (var i = 0; i < o.length; i++) if (Array.isArray(o[i])) return true;
    }
};

CSSOCompressor.prototype.getRule = function(token) {
    if (token !== undefined && token !== null) return token[1];
};

CSSOCompressor.prototype.process = function(rules, token, container, i, path) {
    var rule = this.getRule(token);
    if (rule && rules[rule]) {
        var r = rules[rule],
            x1 = token, x2;
        for (var k = 0; k < r.length; k++) {
            x2 = this[r[k]](x1, rule, container, i, path);
            if (x2 === null) return null;
            else if (x2 !== undefined) x1 = x2;
        }
    }
    return x1;
};

CSSOCompressor.prototype.compress = function(tree) {
    this.init();
    this.info = typeof tree[0] !== 'string';
    var x = this.info ? tree : this.injectInfo([tree])[0],
        l0, l1 = 100000000000;
    x = this.walk(this.ccrules, x, '/0');
    x = this.walk(this.crules, x, '/0');
    x = this.walk(this.prules, x, '/0');
    this.disjoin(x);
    x = this.walk(this.rbrules, x, '/0');
    do {
        l0 = l1;
        x = this.walk(this.rjrules, x, '/0');
        x = this.walk(this.rrrules, x, '/0');
        l1 = translator.translate(cleanInfo(x)).length;
    } while (l0 > l1)
    x = this.walk(this.frules, x, '/0');
    return this.info ? x : cleanInfo(x);
};

CSSOCompressor.prototype.injectInfo = function(token) {
    var t;
    for (var i = token.length - 1; i > -1; i--) {
        t = token[i];
        if (t && Array.isArray(t)) {
            if (this.isContainer(t)) t = this.injectInfo(t);
            t.splice(0, 0, {});
        }
    }
    return token;
};

CSSOCompressor.prototype.disjoin = function(container) {
    var t, x, s, r, sr;
    for (var i = container.length - 1; i > -1; i--) {
        t = container[i];
        if (t && Array.isArray(t)) {
            if (t[1] === 'ruleset') {
                s = t[2];
                if (s.length > 3) {
                    sr = s.slice(0, 2);
                    for (var k = s.length - 1; k > 1; k--) {
                        r = this.copyArray(t);
                        r[2] = sr.concat([s[k]]);
                        r[2][0].s = s[k][0].s;
                        container.splice(i + 1, 0, r);
                    }
                    container.splice(i, 1);
                }
            }
        }
        if (this.isContainer(t)) this.disjoin(t);
    }
};

CSSOCompressor.prototype.walk = function(rules, container, path) {
    var t, x;
    for (var i = container.length - 1; i > -1; i--) {
        t = container[i];
        if (t && Array.isArray(t)) {
            if (this.isContainer(t)) t = this.walk(rules, t, path + '/' + i); // go inside
            if (t === null) container.splice(i, 1);
            else {
                if (x = this.process(rules, t, container, i, path)) container[i] = x; // compressed not null
                else if (x === null) container.splice(i, 1); // null is the mark to delete token
            }
        }
    }
    return container.length ? container : null;
};

CSSOCompressor.prototype.cleanCharset = function(token, rule, container, i) {
    if (token[2][2][2] === 'charset') {
        for (i = i - 1; i > 1; i--) {
            if (container[i][1] !== 's' && container[i][1] !== 'comment') return null;
        }
    }
};

CSSOCompressor.prototype.cleanImport = function(token, rule, container, i) {
    var x;
    for (i = i - 1; i > 1; i--) {
        x = container[i][1];
        if (x !== 's' && x !== 'comment') {
            if (x === 'atrules') {
                x = container[i][2][2][2];
                if (x !== 'import' && x !== 'charset') return null;
            } else return null;
        }
    }
};

CSSOCompressor.prototype.cleanComment = function(token, rule, container, i) {
    var pr = ((container[1] === 'braces' && i === 4) ||
              (container[1] !== 'braces' && i === 2)) ? null : this.getRule(container[i - 1]),
        nr = i === container.length - 1 ? null : this.getRule(container[i + 1]);

    if (nr !== null && pr !== null) {
        if (this._cleanComment(nr) || this._cleanComment(pr)) return null;
    } else return null;
};

CSSOCompressor.prototype._cleanComment = function(r) {
    switch(r) {
        case 's':
        case 'operator':
        case 'attrselector':
        case 'block':
        case 'decldelim':
        case 'ruleset':
        case 'declaration':
        case 'atruleb':
        case 'atrules':
        case 'atruler':
        case 'important':
        case 'nth':
        case 'combinator':
            return true;
    }
};

CSSOCompressor.prototype.nextToken = function(container, type, i, exactly) {
    var t, r;
    for (; i < container.length; i++) {
        t = container[i];
        if (Array.isArray(t)) {
            r = t[1];
            if (r === type) return t;
            else if (exactly && r !== 's') return;
        }
    }
};

CSSOCompressor.prototype.cleanWhitespace = function(token, rule, container, i) {
    var pr = ((container[1] === 'braces' && i === 4) ||
              (container[1] !== 'braces' && i === 2)) ? null : this.getRule(container[i - 1]),
        nr = i === container.length - 1 ? null : this.getRule(container[i + 1]);

    if (!(container[1] === 'atrulerq' && !pr) && !this.issue16(container, i)) {
        if (nr !== null && pr !== null) {
            if (this._cleanWhitespace(nr, false) || this._cleanWhitespace(pr, true)) return null;
        } else return null;
    }

    token[2] = ' ';
    return token;
};

// See https://github.com/afelix/csso/issues/16
CSSOCompressor.prototype.issue16 = function(container, i) {
    return (i !== 2 && i !== container.length - 1 && container[i - 1][1] === 'uri');
};

CSSOCompressor.prototype._cleanWhitespace = function(r, left) {
    switch(r) {
        case 's':
        case 'operator':
        case 'attrselector':
        case 'block':
        case 'decldelim':
        case 'ruleset':
        case 'declaration':
        case 'atruleb':
        case 'atrules':
        case 'atruler':
        case 'important':
        case 'nth':
        case 'combinator':
            return true;
    }
    if (left) {
        switch(r) {
            case 'funktion':
            case 'braces':
            case 'uri':
                return true;
        }
    }
};

CSSOCompressor.prototype.cleanDecldelim = function(token) {
    for (var i = token.length - 1; i > 1; i--) {
        if (this.getRule(token[i]) === 'decldelim' &&
            this.getRule(token[i + 1]) !== 'declaration') token.splice(i, 1);
    }
    if (this.getRule(token[2]) === 'decldelim') token.splice(2, 1);
    return token;
};

CSSOCompressor.prototype.compressNumber = function(token) {
    var x = token[2];

    if (/^0*/.test(x)) x = x.replace(/^0+/, '');
    if (/\.0*$/.test(x)) x = x.replace(/\.0*$/, '');
    if (/\..*[1-9]+0+$/.test(x)) x = x.replace(/0+$/, '');
    if (x === '.' || x === '') x = '0';

    token[2] = x;
    return token;
};

CSSOCompressor.prototype.compressColor = function(token, rule, container, i) {
    switch(rule) {
        case 'vhash':
            return this.compressHashColor(token);
        case 'funktion':
            return this.compressFunctionColor(token);
        case 'ident':
            return this.compressIdentColor(token, rule, container, i);
    }
};

CSSOCompressor.prototype.compressIdentColor = function(token, rule, container, i) {
    var map = { 'yellow': 'ff0',
                'fuchsia': 'f0f',
                'white': 'fff',
                'black': '000',
                'blue': '00f',
                'aqua': '0ff' },
        allow = { 'value': 1, 'functionBody': 1 },
        _x = token[2].toLowerCase();

    if (container[1] in allow && _x in map) return [{}, 'vhash', map[_x]];
};

CSSOCompressor.prototype.compressHashColor = function(token) {
    return this._compressHashColor(token[2], token[0]);
};

CSSOCompressor.prototype._compressHashColor = function(x, info) {
    var map = { 'f00': 'red',
                'c0c0c0': 'silver',
                '808080': 'gray',
                '800000': 'maroon',
                '800080': 'purple',
                '008000': 'green',
                '808000': 'olive',
                '000080': 'navy',
                '008080': 'teal'},
        _x = x;
    x = x.toLowerCase();

    if (x.length === 6 &&
        x.charAt(0) === x.charAt(1) &&
        x.charAt(2) === x.charAt(3) &&
        x.charAt(4) === x.charAt(5)) x = x.charAt(0) + x.charAt(2) + x.charAt(4);

    return map[x] ? [info, 'string', map[x]] : [info, 'vhash', (x.length < _x.length ? x : _x)];
};

CSSOCompressor.prototype.compressFunctionColor = function(token) {
    var ident = token[2],
        i, v = [], t, h = '', body;

    if (token[2][2] === 'rgb') {
        body = token[3];
        for (i = 2; i < body.length; i++) {
            t = this.getRule(body[i]);
            if (t === 'number') v.push(body[i]);
            else if (t !== 'operator') { v = []; break }
        }
        if (v.length === 3) {
            h += (t = Number(v[0][2]).toString(16)).length === 1 ? '0' + t : t;
            h += (t = Number(v[1][2]).toString(16)).length === 1 ? '0' + t : t;
            h += (t = Number(v[2][2]).toString(16)).length === 1 ? '0' + t : t;
            if (h.length === 6) return this._compressHashColor(h, {});
        }
    }
};

CSSOCompressor.prototype.compressDimension = function(token) {
    if (token[2][2] === '0') return token[2];
};

CSSOCompressor.prototype.compressString = function(token) {
    var s = token[2], r = '', c;
    for (var i = 0; i < s.length; i++) {
        c = s.charAt(i);
        if (c === '\\' && s.charAt(i + 1) === '\n') i++;
        else r += c;
    }
    if (s.length !== r.length) return [{}, 'string', r];
};

CSSOCompressor.prototype.compressFontWeight = function(token) {
    var p = token[2],
        v = token[3];
    if (p[2][2].indexOf('font-weight') !== -1 && v[2][1] === 'ident') {
        if (v[2][2] === 'normal') v[2] = [{}, 'number', '400'];
        else if (v[2][2] === 'bold') v[2] = [{}, 'number', '700'];
        return token;
    }
};

CSSOCompressor.prototype.cleanEmptyBlock = function(token) {
    if (token[3].length === 2) return null;
};

CSSOCompressor.prototype.destroyDelims = function() {
    return null;
};

CSSOCompressor.prototype.preTranslate = function(token) {
    token[0].s = translator.translate(cleanInfo(token));
    return token;
};

CSSOCompressor.prototype.restructureBlock = function(token, rule, container, i, path) {
    var x, p, v, imp,
        r = container[1],
        props =  r === 'ruleset' ? this.props : {},
        selector = r === 'ruleset' ? container[2][2][0].s : '',
        pre = this.pathUp(path) + '/' + selector + '/',
        ppre;

    for (var i = token.length - 1; i > -1; i--) {
        x = token[i];
        if (this.getRule(x) === 'declaration') {
            v = x[3];
            imp = v[v.length - 1][1] === 'important';
            p = x[2][0].s;
            ppre = this.buildPPre(pre, p, v, x);
            x[0].id = path + '/' + i;
            if (t = props[ppre]) {
                if (imp && !t.imp) {
                    props[ppre] = { block: token, imp: imp, id: x[0].id };
                    this.deleteProperty(t.block, t.id);
                } else token.splice(i, 1);
            } else if (this.needless(p, props, pre, imp, v, x)) token.splice(i, 1);
            else props[ppre] = { block: token, imp: imp, id: x[0].id };
        }
    }
    return token;
};

CSSOCompressor.prototype.buildPPre = function(pre, p, v, d) {
    if (p.indexOf('background') !== -1) return pre + d[0].s;

    var ppre = pre,
        _v = v.slice(2),
        colorMark = [
            0, // ident, vhash, rgb
            0, // hsl
            0, // hsla
            0  // rgba
        ];

    for (var i = 0; i < _v.length; i++) {
        switch(_v[i][1]) {
            case 'vhash':
            case 'ident':
                colorMark[0] = 1; break;
            case 'funktion':
                switch(_v[i][2][2]) {
                    case 'rgb':
                        colorMark[0] = 1; break;
                    case 'hsl':
                        colorMark[1] = 1; break;
                    case 'hsla':
                        colorMark[2] = 1; break;
                    case 'rgba':
                        colorMark[3] = 1; break;
                }
                break;
        }
    }

    return pre + p + colorMark.join('');
};

CSSOCompressor.prototype.deleteProperty = function(block, id) {
    var d;
    for (var i = block.length - 1; i > 1; i--) {
        d = block[i];
        if (Array.isArray(d) && d[1] === 'declaration' && d[0].id === id) {
            block.splice(i, 1);
            return;
        }
    }
};

CSSOCompressor.prototype.nlTable = {
    'border-width': ['border'],
    'border-style': ['border'],
    'border-color': ['border'],
    'border-top': ['border'],
    'border-right': ['border'],
    'border-bottom': ['border'],
    'border-left': ['border'],
    'border-top-width': ['border-top', 'border-width', 'border'],
    'border-right-width': ['border-right', 'border-width', 'border'],
    'border-bottom-width': ['border-bottom', 'border-width', 'border'],
    'border-left-width': ['border-left', 'border-width', 'border'],
    'border-top-style': ['border-top', 'border-style', 'border'],
    'border-right-style': ['border-right', 'border-style', 'border'],
    'border-bottom-style': ['border-bottom', 'border-style', 'border'],
    'border-left-style': ['border-left', 'border-style', 'border'],
    'border-top-color': ['border-top', 'border-color', 'border'],
    'border-right-color': ['border-right', 'border-color', 'border'],
    'border-bottom-color': ['border-bottom', 'border-color', 'border'],
    'border-left-color': ['border-left', 'border-color', 'border'],
    'margin-top': ['margin'],
    'margin-right': ['margin'],
    'margin-bottom': ['margin'],
    'margin-left': ['margin'],
    'padding-top': ['padding'],
    'padding-right': ['padding'],
    'padding-bottom': ['padding'],
    'padding-left': ['padding'],
    'font-style': ['font'],
    'font-variant': ['font'],
    'font-weight': ['font'],
    'font-size': ['font'],
    'font-family': ['font'],
    'list-style-type': ['list-style'],
    'list-style-position': ['list-style'],
    'list-style-image': ['list-style']
};

CSSOCompressor.prototype.needless = function(name, props, pre, imp, v, d) {
    var vendor = name.charAt(0) === '-' ? name.substr(0, name.indexOf('-', 2) + 1) : '',
        prop = name.substr(vendor.length),
        x, t, ppre;
    if (prop in this.nlTable) {
        x = this.nlTable[prop];
        for (var i = 0; i < x.length; i++) {
            ppre = this.buildPPre(pre, vendor + x[i], v, d);
            if (t = props[ppre]) return (!imp || t.imp);
        }
    }
};

CSSOCompressor.prototype.rejoinRuleset = function(token, rule, container, i) {
    var p = i === 2 ? null : container[i - 1],
        ps = p ? p[2].slice(2) : [],
        pb = p ? p[3].slice(2) : [],
        ts = token[2].slice(2),
        tb = token[3].slice(2),
        ph, th, r, nr;

    if (!tb.length) return null;

    if (ps.length && pb.length) {
        // try to join by selectors
        ph = this.getHash(ps);
        th = this.getHash(ts);
        if (this.equalHash(th, ph)) {
            p[3] = p[3].concat(token[3].splice(2));
            return null;
        }
        // try to join by properties
        r = this.analyze(token, p);
        if (!r.ne1.length && !r.ne2.length) {
            p[2] = this.cleanSelector(p[2].concat(token[2].splice(2)));
            p[2][0].s = translator.translate(cleanInfo(p[2]));
            return null;
        }
    }
};

CSSOCompressor.prototype.restructureRuleset = function(token, rule, container, i) {
    var p = i === 2 ? null : container[i - 1],
        ps = p ? p[2].slice(2) : [],
        pb = p ? p[3].slice(2) : [],
        ts = token[2].slice(2),
        tb = token[3].slice(2),
        ph, th, r, nr;

    if (!tb.length) return null;

    if (ps.length && pb.length) {
        // try to join by properties
        r = this.analyze(token, p);
        if (r.eq.length && (r.ne1.length || r.ne2.length)) {
            if (r.ne1.length && !r.ne2.length) { // p in token
                var ns = token[2].slice(2), // TODO: copypaste
                    nss = translator.translate(cleanInfo(token[2])),
                    sl = nss.length + // selector length
                         ns.length - 1, // delims length
                    bl = this.calcLength(r.eq) + // declarations length
                         r.eq.length - 1; // decldelims length
                if (sl < bl) {
                    p[2] = this.cleanSelector(p[2].concat(token[2].slice(2)));
                    token[3].splice(2);
                    token[3] = token[3].concat(r.ne1);
                    return token;
                }
            } else if (r.ne2.length && !r.ne1.length) { // token in p
                var ns = p[2].slice(2),
                    nss = translator.translate(cleanInfo(p[2])),
                    sl = nss.length + // selector length
                         ns.length - 1, // delims length
                    bl = this.calcLength(r.eq) + // declarations length
                         r.eq.length - 1; // decldelims length
                if (sl < bl) {
                    token[2] = this.cleanSelector(p[2].concat(token[2].slice(2)));
                    p[3].splice(2);
                    p[3] = p[3].concat(r.ne2);
                    return token;
                }
            } else { // extract equal block?
                var ns = this.cleanSelector(p[2].concat(token[2].slice(2))),
                    nss = translator.translate(cleanInfo(ns)),
                    rl = nss.length + // selector length
                         ns.length - 1 + // delims length
                         2, // braces length
                    bl = this.calcLength(r.eq) + // declarations length
                         r.eq.length - 1; // decldelims length

                if (bl >= rl) { // ok, it's good enough to extract
                    ns[0].s = nss;
                    nr = [{f:0, l:0}, 'ruleset', ns, [{f:0,l:0}, 'block'].concat(r.eq)];
                    token[3].splice(2);
                    token[3] = token[3].concat(r.ne1);
                    p[3].splice(2);
                    p[3] = p[3].concat(r.ne2);
                    container.splice(i, 0, nr);
                    return nr;
                }
            }
        }
    }
};



CSSOCompressor.prototype.calcLength = function(tokens) {
    var r = 0;
    for (var i = 0; i < tokens.length; i++) r += tokens[i][0].s.length;
    return r;
};

CSSOCompressor.prototype.cleanSelector = function(token) {
    if (token.length === 2) return null;
    var h = {}, s;
    for (var i = 2; i < token.length; i++) {
        s = token[i][0].s;
        if (s in h) token.splice(i, 1), i--;
        else h[s] = 1;
    }

    return token;
};

CSSOCompressor.prototype.analyze = function(r1, r2) {
    var s1 = r1[2], s2 = r2[2],
        ss1 = s1.slice(2), ss2 = s2.slice(2),
        b1 = r1[3], b2 = r2[3],
        d1 = b1.slice(2), d2 = b2.slice(2),
        r = { eq: [], ne1: [], ne2: [] },
        h1, h2, i, x;

    h1 = this.getHash(d1);
    h2 = this.getHash(d2);

    for (i = 0; i < d1.length; i++) {
        x = d1[i];
        if (x[0].s in h2) r.eq.push(x);
        else r.ne1.push(x);
    }

    for (i = 0; i < d2.length; i++) {
        x = d2[i];
        if (!(x[0].s in h1)) r.ne2.push(x);
    }

    return r;
};

CSSOCompressor.prototype.equalHash = function(h0, h1) {
    for (var k in h0) if (!(k in h1)) return false;
    for (var k in h1) if (!(k in h0)) return false;
    return true;
};

CSSOCompressor.prototype.getHash = function(tokens) {
    var r = {};
    for (var i = 0; i < tokens.length; i++) r[tokens[i][0].s] = 1;
    return r;
};

CSSOCompressor.prototype.delimSelectors = function(token) {
    for (var i = token.length - 1; i > 2; i--) {
        token.splice(i, 0, [{}, 'delim']);
    }
};

CSSOCompressor.prototype.delimBlocks = function(token) {
    for (var i = token.length - 1; i > 2; i--) {
        token.splice(i, 0, [{}, 'decldelim']);
    }
};

CSSOCompressor.prototype.copyArray = function(a) {
    var r = [], t;

    for (var i = 0; i < a.length; i++) {
        t = a[i];
        if (Array.isArray(t)) r.push(this.copyArray(t));
        else if (typeof t === 'object') r.push(this.copyObject(t));
        else r.push(t);
    }

    return r;
};

CSSOCompressor.prototype.copyObject = function(o) {
    var r = {};
    for (var k in o) r[k] = o[k];
    return r;
};

CSSOCompressor.prototype.pathUp = function(path) {
    return path.substr(0, path.lastIndexOf('/'));
};
