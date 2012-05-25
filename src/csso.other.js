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
