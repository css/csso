function CSSOParser() {}

CSSOParser.prototype.parse = function(s, rule) {
    this._src = s;
    this._stack = [];
    this._chains = [];
    this._i = { f: 0, l: 0 };
    var r = this.$()._o(rule)._();
    return r ? r[0] : null;
};

CSSOParser.prototype._push = function(o) {
    this._stack.push(o);
};

CSSOParser.prototype._last = function() {
    return this._chains[this._chains.length - 1];
};

CSSOParser.prototype._fail = function() {
    this._last().fail = true;
};

CSSOParser.prototype._failed = function() {
    return this._last().fail;
};

CSSOParser.prototype._apply = function(s) {
    switch (s.charAt(0)) {
        case '.': return this._s(s.substr(1));
        case ',': return this._r(s.substr(1));
        default: return this[s]();
    }
};

CSSOParser.prototype._gi = function() {
    return this._last().l;
};

CSSOParser.prototype._si = function(i) {
    if (this._chains.length) this._last().l = i;
};

CSSOParser.prototype._info = function() {
    return { f: this._i.f, l: this._i.l };
};

CSSOParser.prototype.$ = function() {
    var i = this._chains.length ? this._last().l + 1 : 0;
    this._chains.push({ i: this._stack.length, fail: false, f: i, l: i - 1 });
    return this;
};

CSSOParser.prototype._ = function() {
    var c = this._chains.pop(),
        r = this._stack.splice(c.i);
    if (!c.fail) {
        if (c.l >= c.f) this._si(c.l);
        this._i = { f: c.f, l: c.l };
        return r.length ? r : null;
    }
};

CSSOParser.prototype._o = function() {
    if (!this._failed()) {
        var a = arguments, b = [], t;
        for (var i = 0; i < a.length; i++) {
            if (t = this._apply(a[i])) break;
        }
        t !== undefined ? this._push(t) : this._fail();
    }
    return this;
};

CSSOParser.prototype._om = function() {
    if (!this._failed()) {
        var a = arguments, t, n0, n1 = this._gi() + 1, b = [];
        do {
            n0 = n1;
            for (var i = 0; i < a.length; i++) {
                if (t = this._apply(a[i])) {
                    b.push(t);
                    n1 = this._gi() + 1;
                    break;
                }
            }
        } while (n0 !== n1);
        b.length ? this._push(b) : this._fail();
    }
    return this;
};

CSSOParser.prototype._zm = function() {
    if (!this._failed()) {
        var a = arguments, t, n0, n1 = this._gi() + 1, b = [];
        do {
            n0 = n1;
            for (var i = 0; i < a.length; i++) {
                if (t = this._apply(a[i])) {
                    b.push(t);
                    n1 = this._gi() + 1;
                    break;
                }
            }
        } while (n0 !== n1);
        if (b.length) this._push(b);
    }
    return this;
};

CSSOParser.prototype._zmn = function() {
    if (!this._failed()) {
        var i = this._gi() + 1;
        this._zm.apply(this, arguments);
        if (i === this._gi() + 1) this._push(null);
    }
    return this;
};

CSSOParser.prototype._zme = function() {
    if (!this._failed()) {
        var i = this._gi() + 1;
        this._zm.apply(this, arguments);
        if (i === this._gi() + 1) this._push([]);
    }
    return this;
};

CSSOParser.prototype._zo = function() {
    if (!this._failed()) {
        var a = arguments, t;
        for (var i = 0; i < a.length; i++) {
            if (t = this._apply(a[i])) break;
        }
        this._push(t ? t : null);
    }
    return this;
};

CSSOParser.prototype._not = function() {
    if (!this._failed()) {
        var f = this._gi() + 1,
            s = this._src,
            a = arguments,
            p = new CSSOParser(),
            _s, t, l = s.length + 1;
        for (var i = f; i < l; i++) {
            _s = s.substr(i);
            for (var j = 0; j < a.length; j++) {
                if ((t = p.parse(_s, a[j])) !== null) {
                    _s  = s.substring(f, i);
                    i = l;
                    break;
                }
            }
        }
        if (_s) this._si(f + _s.length - 1);
        this._push(_s);
    }
    return this;
};

CSSOParser.prototype._s = function(s) {
    var sl = s.length,
        f = this._gi() + 1;
    if (this._src.substr(f, sl) === s) {
        this._si(f + sl - 1);
        return s;
    }
};

CSSOParser.prototype._c = function() {
    var s = this._src,
        f = this._gi() + 1;
    if (f <= s.length) {
        this._si(f);
        return s.charAt(f);
    }
};

CSSOParser.prototype._r = function(r) {
    var n = r.substr(0, r.indexOf(' ')),
        f = this._gi() + 1,
        s = n !== '0' ? this._src.substring(f, f + new Number(n)) : this._src.substr(f),
        rr = new RegExp(r.substr(n.length + 1)).exec(s);
    if (rr && rr.index === 0) {
        this._si(f + rr[0].length - 1);
        return rr[0];
    }
};

CSSOParser.prototype._join = function(a) {
    return a ? a.join('') : '';
};

CSSOParser.prototype._cc = function(x, y) {
    y.forEach(function(e) {
        x = x.concat(e);
    });

    return x;
};
CSSOParser.prototype.unknown = function() {
    var _b_;
    if (_b_ = this.$()._o('munknown')._()) {
        return [this._info(), 'unknown', _b_[0]];
    }
};
CSSOParser.prototype.mstring1 = function() {
    var _b_;
    if (_b_ = this.$()._not('."','.\\"')._()) {
        return _b_[0];
    }
};
CSSOParser.prototype.mstring2 = function() {
    var _b_;
    if (_b_ = this.$()._not('.\'','.\\\'')._()) {
        return _b_[0];
    }
};
CSSOParser.prototype.mstring = function() {
    var _b_;
    if (_b_ = this.$()._o('."')._zme('.\\"','mstring1')._o('."')._()) {
        return ('"' + _b_[1].join('') + '"');
    }
    if (_b_ = this.$()._o('.\'')._zme('.\\\'','mstring2')._o('.\'')._()) {
        return ("'" + _b_[1].join('') + "'");
    }
};
CSSOParser.prototype.string = function() {
    var _b_;
    if (_b_ = this.$()._o('mstring')._()) {
        return [this._info(), 'string', _b_[0]];
    }
};
CSSOParser.prototype.escape = function() {
    var _b_;
    if (_b_ = this.$()._o('.\\')._o('_c')._()) {
        return ('\\' + _b_[1]);
    }
};
CSSOParser.prototype.ident = function() {
    var _b_;
    if (_b_ = this.$()._o('mident')._()) {
        return [this._info(), 'ident', _b_[0]];
    }
};
CSSOParser.prototype.atkeyword = function() {
    var _b_;
    if (_b_ = this.$()._o('.@')._o('ident')._()) {
        return [this._info(), 'atkeyword', _b_[1]];
    }
};
CSSOParser.prototype.shash = function() {
    var _b_;
    if (_b_ = this.$()._o('.#')._o('mname')._()) {
        return [this._info(), 'shash', _b_[1]];
    }
};
CSSOParser.prototype.vhash = function() {
    var _b_;
    if (_b_ = this.$()._o('.#')._o('mname2')._()) {
        return [this._info(), 'vhash', _b_[1]];
    }
};
CSSOParser.prototype.number = function() {
    var _b_;
    if (_b_ = this.$()._o('mnumber')._()) {
        return [this._info(), 'number', _b_[0]];
    }
};
CSSOParser.prototype.percentage = function() {
    var _b_;
    if (_b_ = this.$()._o('number')._o('.%')._()) {
        return [this._info(), 'percentage', _b_[0]];
    }
};
CSSOParser.prototype.ident2 = function() {
    var _b_;
    if (_b_ = this.$()._o('mname2')._()) {
        return [this._info(), 'ident', _b_[0]];
    }
};
CSSOParser.prototype.dimension = function() {
    var _b_;
    if (_b_ = this.$()._o('number')._o('ident2')._()) {
        return [this._info(), 'dimension', _b_[0], _b_[1]];
    }
};
CSSOParser.prototype.cdo = function() {
    var _b_;
    if (_b_ = this.$()._o('.<!--')._()) {
        return [this._info(), 'cdo'];
    }
};
CSSOParser.prototype.cdc = function() {
    var _b_;
    if (_b_ = this.$()._o('.-->')._()) {
        return [this._info(), 'cdc'];
    }
};
CSSOParser.prototype.s = function() {
    var _b_;
    if (_b_ = this.$()._om('mw')._()) {
        return [this._info(), 's', _b_[0].join('')];
    }
};
CSSOParser.prototype.attrselector = function() {
    var _b_;
    if (_b_ = this.$()._o('.=','.~=','.^=','.$=','.*=','.|=','.~')._()) {
        return [this._info(), 'attrselector', _b_[0]];
    }
};
CSSOParser.prototype.delim = function() {
    var _b_;
    if (_b_ = this.$()._o('.,')._()) {
        return [this._info(), 'delim'];
    }
};
CSSOParser.prototype.comment = function() {
    var _b_;
    if (_b_ = this.$()._o('mcomment1')._()) {
        return [this._info(), 'comment', _b_[0]];
    }
};
CSSOParser.prototype.sc = function() {
    var _b_;
    if (_b_ = this.$()._o('s','comment')._()) {
        return _b_[0];
    }
};
CSSOParser.prototype.tset = function() {
    var _b_;
    if (_b_ = this.$()._o('vhash','any','sc','operator')._()) {
        return _b_[0];
    }
};
CSSOParser.prototype.stylesheet = function() {
    var _b_;
    if (_b_ = this.$()._zme('cdo','cdc','sc','statement','unknown')._()) {
        return [this._info(), 'stylesheet'].concat(_b_[0]);
    }
};
CSSOParser.prototype.statement = function() {
    var _b_;
    if (_b_ = this.$()._o('ruleset','atrule')._()) {
        return _b_[0];
    }
};
CSSOParser.prototype.atruleb = function() {
    var _b_;
    if (_b_ = this.$()._o('atkeyword')._zme('tset')._o('block')._()) {
        return [this._info(), 'atruleb', _b_[0]].concat(_b_[1], [_b_[2]]);
    }
};
CSSOParser.prototype.atrules = function() {
    var _b_;
    if (_b_ = this.$()._o('atkeyword')._zme('tset')._o('.;')._()) {
        return [this._info(), 'atrules', _b_[0]].concat(_b_[1]);
    }
};
CSSOParser.prototype.atrulerq = function() {
    var _b_;
    if (_b_ = this.$()._zme('tset')._()) {
        return [this._info(), 'atrulerq'].concat(_b_[0]);
    }
};
CSSOParser.prototype.atrulers = function() {
    var _b_;
    if (_b_ = this.$()._zme('sc')._zme('ruleset')._zme('sc')._()) {
        return [this._info(), 'atrulers'].concat(_b_[0], _b_[1], _b_[2]);
    }
};
CSSOParser.prototype.atruler = function() {
    var _b_;
    if (_b_ = this.$()._o('atkeyword')._o('atrulerq')._o('.{')._o('atrulers')._o('.}')._()) {
        return [this._info(), 'atruler', _b_[0], _b_[1], _b_[3]];
    }
};
CSSOParser.prototype.atrule = function() {
    var _b_;
    if (_b_ = this.$()._o('atruler','atruleb','atrules')._()) {
        return _b_[0];
    }
};
CSSOParser.prototype.blockdecl = function() {
    var _b_;
    if (_b_ = this.$()._zme('sc')._o('filter','declaration')._o('decldelim')._zme('sc')._()) {
        return [].concat(_b_[0], [_b_[1]], [_b_[2]], _b_[3]);
    }
    if (_b_ = this.$()._zme('sc')._o('filter','declaration')._zme('sc')._()) {
        return [].concat(_b_[0], [_b_[1]], _b_[2]);
    }
    if (_b_ = this.$()._zme('sc')._o('decldelim')._zme('sc')._()) {
        return [].concat(_b_[0], [_b_[1]], _b_[2]);
    }
    if (_b_ = this.$()._om('sc')._()) {
        return _b_[0];
    }
};
CSSOParser.prototype.decldelim = function() {
    var _b_;
    if (_b_ = this.$()._o('.;')._()) {
        return [this._info(), 'decldelim'];
    }
};
CSSOParser.prototype.block = function() {
    var _b_;
    if (_b_ = this.$()._o('.{')._zme('blockdecl')._o('.}')._()) {
        return this._cc([this._info(), 'block'], _b_[1]);
    }
};
CSSOParser.prototype.ruleset = function() {
    var _b_;
    if (_b_ = this.$()._zme('selector')._o('block')._()) {
        return [this._info(), 'ruleset'].concat(_b_[0], [_b_[1]]);
    }
};
CSSOParser.prototype.combinator = function() {
    var _b_;
    if (_b_ = this.$()._o('.+','.>','.~')._()) {
        return [this._info(), 'combinator', _b_[0]];
    }
};
CSSOParser.prototype.attrib = function() {
    var _b_;
    if (_b_ = this.$()._o('.[')._zme('sc')._o('ident')._zme('sc')._o('attrselector')._zme('sc')._o('ident','string')._zme('sc')._o('.]')._()) {
        return [this._info(), 'attrib'].concat(_b_[1], [_b_[2]], _b_[3], [_b_[4]], _b_[5], [_b_[6]], _b_[7]);
    }
    if (_b_ = this.$()._o('.[')._zme('sc')._o('ident')._zme('sc')._o('.]')._()) {
        return [this._info(), 'attrib'].concat(_b_[1], [_b_[2]], _b_[3]);
    }
};
CSSOParser.prototype.clazz = function() {
    var _b_;
    if (_b_ = this.$()._o('..')._o('ident')._()) {
        return [this._info(), 'clazz', _b_[1]];
    }
};
CSSOParser.prototype.pseudoe = function() {
    var _b_;
    if (_b_ = this.$()._o('.::')._o('ident')._()) {
        return [this._info(), 'pseudoe', _b_[1]];
    }
};
CSSOParser.prototype.pseudoc = function() {
    var _b_;
    if (_b_ = this.$()._o('.:')._o('funktion','ident')._()) {
        return [this._info(), 'pseudoc', _b_[1]];
    }
};
CSSOParser.prototype.pseudo = function() {
    var _b_;
    if (_b_ = this.$()._o('pseudoe','pseudoc')._()) {
        return _b_[0];
    }
};
CSSOParser.prototype.nthf = function() {
    var _b_;
    if (_b_ = this.$()._o('.:')._o('.nth-')._o('.child','.last-child','.of-type','.last-of-type')._()) {
        return [this._info(), 'ident', _b_[1] + _b_[2]];
    }
};
CSSOParser.prototype.nth = function() {
    var _b_;
    if (_b_ = this.$()._om(',1 ^[\\d]','.n')._()) {
        return [this._info(), 'nth', _b_[0].join('')];
    }
    if (_b_ = this.$()._o('.even','.odd')._()) {
        return [this._info(), 'nth', _b_[0]];
    }
};
CSSOParser.prototype.nthselector = function() {
    var _b_;
    if (_b_ = this.$()._o('nthf')._o('.(')._zme('sc','unary','nth')._o('.)')._()) {
        return [this._info(), 'nthselector', _b_[0]].concat(_b_[2]);
    }
};
CSSOParser.prototype.namespace = function() {
    var _b_;
    if (_b_ = this.$()._o('.|')._()) {
        return [this._info(), 'namespace'];
    }
};
CSSOParser.prototype.simpleselector = function() {
    var _b_;
    if (_b_ = this.$()._om('nthselector','combinator','attrib','pseudo','clazz','shash','any','sc','namespace')._()) {
        return this._cc([this._info(), 'simpleselector'], [_b_[0]]);
    }
};
CSSOParser.prototype.selector = function() {
    var _b_;
    if (_b_ = this.$()._om('simpleselector','delim')._()) {
        return [this._info(), 'selector'].concat(_b_[0]);
    }
};
CSSOParser.prototype.declaration = function() {
    var _b_;
    if (_b_ = this.$()._o('property')._o('.:')._o('value')._()) {
        return [this._info(), 'declaration', _b_[0], _b_[2]];
    }
};
CSSOParser.prototype.filtern = function() {
    var _b_;
    if (_b_ = this.$()._o('.-filter','.$filter','._filter','.*filter','.-ms-filter','.filter')._()) {
        return [this._info(), 'ident', _b_[0]];
    }
};
CSSOParser.prototype.filterp = function() {
    var _b_;
    if (_b_ = this.$()._o('filtern')._zme('sc')._()) {
        return [this._info(), 'property', _b_[0]].concat(_b_[1]);
    }
};
CSSOParser.prototype.progid0 = function() {
    var _b_;
    if (_b_ = this.$()._not('.)','mstring','mcomment2')._()) {
        return _b_[0];
    }
};
CSSOParser.prototype.progid1 = function() {
    var _b_;
    if (_b_ = this.$()._o('.progid:DXImageTransform.Microsoft.')._o(',25 ^[a-zA-Z]+')._o('.(')._om('mstring','mcomment2','progid0')._o('.)')._()) {
        return [this._info(), 'raw', _b_[0] + _b_[1] + '(' + _b_[3].join('') + ')'];
    }
};
CSSOParser.prototype.progid = function() {
    var _b_;
    if (_b_ = this.$()._zme('sc')._o('progid1')._zme('sc')._()) {
        return [this._info(), 'progid'].concat(_b_[0], [_b_[1]], _b_[2]);
    }
};
CSSOParser.prototype.filterv = function() {
    var _b_;
    if (_b_ = this.$()._om('progid')._()) {
        return [this._info(), 'filterv'].concat(_b_[0]);
    }
};
CSSOParser.prototype.filter = function() {
    var _b_;
    if (_b_ = this.$()._o('filterp')._o('.:')._o('filterv')._()) {
        return [this._info(), 'filter', _b_[0], _b_[2]];
    }
};
CSSOParser.prototype.identp = function() {
    var _b_;
    if (_b_ = this.$()._o('.//')._o('mident')._()) {
        return [this._info(), 'ident', _b_[0] + _b_[1]];
    }
};
CSSOParser.prototype.property = function() {
    var _b_;
    if (_b_ = this.$()._o('identp')._zme('sc')._()) {
        return [this._info(), 'property', _b_[0]].concat(_b_[1]);
    }
    if (_b_ = this.$()._o('ident')._zme('sc')._()) {
        return [this._info(), 'property', _b_[0]].concat(_b_[1]);
    }
};
CSSOParser.prototype.important = function() {
    var _b_;
    if (_b_ = this.$()._o('.!')._zme('sc')._o('.important')._()) {
        return [this._info(), 'important'].concat(_b_[1]);
    }
};
CSSOParser.prototype.unary = function() {
    var _b_;
    if (_b_ = this.$()._o('.-','.+')._()) {
        return [this._info(), 'unary', _b_[0]];
    }
};
CSSOParser.prototype.operator = function() {
    var _b_;
    if (_b_ = this.$()._o('./','.,','.:','.=')._()) {
        return [this._info(), 'operator', _b_[0]];
    }
};
CSSOParser.prototype.uri0 = function() {
    var _b_;
    if (_b_ = this.$()._not('.)','mw')._()) {
        return [this._info(), 'raw', _b_[0]];
    }
};
CSSOParser.prototype.uri = function() {
    var _b_;
    if (_b_ = this.$()._o('.url(')._zme('sc')._o('string')._zme('sc')._o('.)')._()) {
        return [this._info(), 'uri'].concat(_b_[1], [_b_[2]], _b_[3]);
    }
    if (_b_ = this.$()._o('.url(')._zme('sc')._o('uri0')._zme('sc')._o('.)')._()) {
        return [this._info(), 'uri'].concat(_b_[1], [_b_[2]], _b_[3]);
    }
};
CSSOParser.prototype.value = function() {
    var _b_;
    if (_b_ = this.$()._om('sc','vhash','any','block','atkeyword','operator','important')._()) {
        return [this._info(), 'value'].concat(_b_[0]);
    }
};
CSSOParser.prototype.functionBody = function() {
    var _b_;
    if (_b_ = this.$()._zme('tset')._()) {
        return [this._info(), 'functionBody'].concat(_b_[0]);
    }
};
CSSOParser.prototype.funktion = function() {
    var _b_;
    if (_b_ = this.$()._o('notselector')._()) {
        return _b_[0];
    }
    if (_b_ = this.$()._o('ident')._o('.(')._o('functionBody')._o('.)')._()) {
        return [this._info(), 'funktion', _b_[0], _b_[2]];
    }
};
CSSOParser.prototype.notselectorident = function() {
    var _b_;
    if (_b_ = this.$()._o('.not')._()) {
        return [this._info(), 'ident', _b_[0]];
    }
};
CSSOParser.prototype.notselector = function() {
    var _b_;
    if (_b_ = this.$()._o('notselectorident')._o('.(')._o('notselectorBody')._o('.)')._()) {
        return [this._info(), 'funktion', _b_[0], _b_[2]];
    }
};
CSSOParser.prototype.notselectorBody = function() {
    var _b_;
    if (_b_ = this.$()._zo('simpleselector')._()) {
        return [this._info(), 'functionBody', _b_[0]];
    }
};
CSSOParser.prototype.braces = function() {
    var _b_;
    if (_b_ = this.$()._o('.(')._zme('tset')._o('.)')._()) {
        return [this._info(), 'braces', '(', ')'].concat(_b_[1]);
    }
    if (_b_ = this.$()._o('.[')._zme('tset')._o('.]')._()) {
        return [this._info(), 'braces', '[', ']'].concat(_b_[1]);
    }
};
CSSOParser.prototype.jsLT = function() {
    var _b_;
    if (_b_ = this.$()._o('.\n','.\r')._()) {
        return _b_[0];
    }
};
CSSOParser.prototype.jsComment = function() {
    var _b_;
    if (_b_ = this.$()._o('jsMLComment','jsSLComment')._()) {
        return _b_[0];
    }
};
CSSOParser.prototype.jsMLComment = function() {
    var _b_;
    if (_b_ = this.$()._o('./*')._not('.*/')._o('.*/')._()) {
        return (_b_[0] + (_b_[1] ? _b_[1] : '') + _b_[2]);
    }
};
CSSOParser.prototype.jsSLComment = function() {
    var _b_;
    if (_b_ = this.$()._o('.//')._not('jsLT')._()) {
        return ('//' + (_b_[1] ? _b_[1] : ''));
    }
};
CSSOParser.prototype.jsString = function() {
    var _b_;
    if (_b_ = this.$()._o('."')._zme('jsDSChar')._o('."')._()) {
        return ('"' + _b_[1].join('') + '"');
    }
    if (_b_ = this.$()._o('.\'')._zme('jsSSChar')._o('.\'')._()) {
        return ('\'' + _b_[1].join('') + '\'');
    }
};
CSSOParser.prototype.jsDSChar = function() {
    var _b_;
    if (_b_ = this.$()._not('."','.\\','jsLT','jsEscapeChar','jsLineContinuation')._()) {
        return _b_[0];
    }
    if (_b_ = this.$()._o('jsEscapeChar')._()) {
        return _b_[0];
    }
    if (_b_ = this.$()._o('jsLineContinuation')._()) {
        return _b_[0];
    }
};
CSSOParser.prototype.jsSSChar = function() {
    var _b_;
    if (_b_ = this.$()._not('.\'','.\\','jsLT','jsEscapeChar','jsLineContinuation')._()) {
        return _b_[0];
    }
    if (_b_ = this.$()._o('jsEscapeChar')._()) {
        return _b_[0];
    }
    if (_b_ = this.$()._o('jsLineContinuation')._()) {
        return _b_[0];
    }
};
CSSOParser.prototype.jsLineContinuation = function() {
    var _b_;
    if (_b_ = this.$()._o('.\\')._zme('jsLT')._()) {
        return ('\\' + _b_[1].join(''));
    }
};
CSSOParser.prototype.jsEscapeChar = function() {
    var _b_;
    if (_b_ = this.$()._o('.\\')._o('_c')._()) {
        return ('\\' + _b_[1]);
    }
};
CSSOParser.prototype.jsInBraceChar = function() {
    var _b_;
    if (_b_ = this.$()._not('.(','.)','jsComment','jsString','jsEscapeChar')._()) {
        return _b_[0];
    }
};
CSSOParser.prototype.jsBracesContent = function() {
    var _b_;
    if (_b_ = this.$()._om('jsComment','jsString','jsEscapeChar','jsInBraceChar')._()) {
        return _b_[0].join('');
    }
};
CSSOParser.prototype.feb = function() {
    var _b_;
    if (_b_ = this.$()._o('functionExpressionBody')._zme('jsBracesContent')._()) {
        return (_b_[0] + _b_[1].join(''));
    }
};
CSSOParser.prototype.functionExpressionBody = function() {
    var _b_;
    if (_b_ = this.$()._o('.(')._om('jsBracesContent')._zme('feb')._o('.)')._()) {
        return ('(' + _b_[1].join('') + _b_[2].join('') + ')');
    }
    if (_b_ = this.$()._o('.(')._zme('feb')._o('.)')._()) {
        return ('(' + _b_[1].join('') + ')');
    }
    if (_b_ = this.$()._om('jsBracesContent')._zme('feb')._()) {
        return (_b_[0].join('') + _b_[1].join(''));
    }
};
CSSOParser.prototype.functionExpression = function() {
    var _b_;
    if (_b_ = this.$()._o('.expression(')._zme('functionExpressionBody')._o('.)')._()) {
        return [this._info(), 'functionExpression', _b_[1].join('')];
    }
};
CSSOParser.prototype.any = function() {
    var _b_;
    if (_b_ = this.$()._o('braces','string','percentage','dimension','number','uri','functionExpression','funktion','ident','unary')._()) {
        return _b_[0];
    }
};
CSSOParser.prototype.mw = function() {
    var s = this._src,
        sl = s.length,
        f = this._gi() + 1, c, i, v = '';
    for (i = f; i < sl; i++) {
        c = s.charAt(i);
        if (/^[ \n\r\t\f]$/.test(c)) v += c;
        else break;
    }
    if (v.length) {
        this._si(f + v.length - 1);
        return v;
    }
};

CSSOParser.prototype.mnumber = function() {
    var s = this._src,
        sl = s.length,
        f = this._gi() + 1, c, i, v = '',
        n0 = '', d = '', n1 = '';
    for (i = f; i < sl; i++) {
        c = s.charAt(i);
        if (/^[\d]$/.test(c)) n0 += c;
        else break;
    }
    if (s[i++] === '.') {
        d = '.';
        for (; i < sl; i++) {
            c = s.charAt(i);
            if (/^[\d]$/.test(c)) n1 += c;
            else break;
        }
    }
    if ((v = n0 + d + n1).length) {
        this._si(f + v.length - 1);
        return v;
    }
};

CSSOParser.prototype.mident = function() {
    var s = this._src,
        sl = s.length,
        f = this._gi() + 1, i = f, v = '', c, n;
    if (s.charAt(i) === '-') v = '-', i++; // special case
    c = s.charAt(i); n = s.charAt(i + 1);
    if (/^[_$a-zA-Z*]$/.test(c)) v += c; // first char
    else if (c === '\\') {
        v += c;
        if (n) v += n, i++;
    } else return;
    i++;
    for (; i < sl; i++) {
        c = s.charAt(i);
        n = s.charAt(i + 1);
        if (/^[_a-zA-Z0-9\-]$/.test(c)) v += c;
        else if (c === '\\') {
            v += c;
            if (n) v += n, i++;
        } else break;
    }
    if (v && v !== '-') {
        this._si(f + v.length - 1);
        return v;
    }
};

CSSOParser.prototype.mcomment1 = function() {
    var s = this._src,
        f = this._gi() + 1, v = '', i;
    if (s.charAt(f) === '/' && s.charAt(f + 1) === '*') {
        if ((i = s.indexOf('*/', f + 2)) !== -1) {
            v = s.substring(f + 2, i);
            this._si(f + v.length + 3);
        } else {
            v = s.substr(f + 2);
            this._si(f + v.length + 1);
        }
        return v;
    }
};

CSSOParser.prototype.mcomment2 = function() {
    var s = this._src,
        f = this._gi() + 1, v = '/*', i;
    if (s.charAt(f) === '/' && s.charAt(f + 1) === '*') {
        if ((i = s.indexOf('*/', f + 2)) !== -1) {
            v += s.substring(f + 2, i) + '*/';
            this._si(f + v.length - 1);
        } else {
            v += s.substr(f + 2);
            this._si(f + v.length - 1);
        }
        return v;
    }
};

CSSOParser.prototype.mname = function() {
    var s = this._src,
        sl = s.length,
        f = this._gi() + 1, i = f, v = '', c, n;
    for (; i < sl; i++) {
        c = s.charAt(i);
        n = s.charAt(i + 1);
        if (/^[_a-zA-Z0-9\-]$/.test(c)) v += c;
        else if (c === '\\') {
            v += c;
            if (n) v += n, i++;
        } else break;
    }
    if (v) {
        this._si(f + v.length - 1);
        return v;
    }
};

CSSOParser.prototype.mname2 = function() {
    var s = this._src,
        sl = s.length,
        f = this._gi() + 1, i = f, v = '', c, n;
    for (; i < sl; i++) {
        c = s.charAt(i);
        n = s.charAt(i + 1);
        if (/^[_a-zA-Z0-9]$/.test(c)) v += c;
        else if (c === '\\') {
            v += c;
            if (n) v += n, i++;
        } else break;
    }
    if (v) {
        this._si(f + v.length - 1);
        return v;
    }
};

CSSOParser.prototype.munknown = function() {
    var s = this._src,
        sl = s.length,
        f = this._gi() + 1, i = f, v = '', c, n;
    for (; i < sl; i++) {
        c = s.charAt(i);
        v += c;
        if (c === '\n' || c === '\r') break;
    }
    if (v) {
        this._si(f + v.length - 1);
        return v;
    }
};
exports.parse = function(s, rule) {
    return new CSSOParser().parse(s, rule);
};
