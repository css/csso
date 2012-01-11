function TRBL(name) {
    this.name = TRBL.extractMain(name);
    this.sides = {
        'top': null,
        'right': null,
        'bottom': null,
        'left': null
    };
}

TRBL.props = {
    'margin': 1,
    'margin-top': 1,
    'margin-right': 1,
    'margin-bottom': 1,
    'margin-left': 1,
    'padding': 1,
    'padding-top': 1,
    'padding-right': 1,
    'padding-bottom': 1,
    'padding-left': 1
};

TRBL.extractMain = function(name) {
    var i = name.indexOf('-');
    return i === -1 ? name : name.substr(0, i);
};

TRBL.prototype.add = function(name, sValue, tValue) {
    var s = this.sides,
        i, x, side, a = [],
        last;
    if ((i = name.lastIndexOf('-')) !== -1) {
        side = name.substr(i + 1);
        if (side in s) {
            if (!s[side]) {
                s[side] = { s: sValue, t: [tValue[0]] };
                if (tValue[0][1] === 'unary') s[side].t.push(tValue[1]);
            }
            return true;
        }
    } else if (name === this.name) {
        for (i = 0; i < tValue.length; i++) {
            x = tValue[i];
            switch(x[1]) {
                case 'unary':
                    a.push({ s: x[2], t: last = [x] });
                    break;
                case 'number':
                case 'ident':
                    last = (last ? last.push(x) : a.push({ s: x[2], t: [x] }), null);
                    break;
                case 'percentage':
                    last = (last ? last.push(x) : a.push({ s: x[2][2] + '%', t: [x] }), null);
                    break;
                case 'dimension':
                    last = (last ? last.push(x) : a.push({ s: x[2][2] + x[3][2], t: [x] }), null);
                    break;
                case 's':
                case 'comment':
                    break;
                default:
                    return false;
            }
        }

        if (a.length > 4) return false;

        if (!a[1]) a[1] = a[0];
        if (!a[2]) a[2] = a[0];
        if (!a[3]) a[3] = a[1];

        if (!s.top) s.top = a[0];
        if (!s.right) s.right = a[1];
        if (!s.bottom) s.bottom = a[2];
        if (!s.left) s.left = a[3];

        return true;
    }
};

TRBL.prototype.isOkToMinimize = function() {
    var s = this.sides;
    return !!(s.top && s.right && s.bottom && s.left);
};

TRBL.prototype.getValue = function() {
    var s = this.sides,
        a = [s.top, s.right, s.bottom, s.left],
        r = [{}, 'value'];

    if (s.left.s === s.right.s) {
        a.length--;
        if (s.bottom.s === s.top.s) {
            a.length--;
            if (s.right.s === s.top.s) {
                a.length--;
            }
        }
    }

    for (var i = 0; i < a.length - 1; i++) {
        r = r.concat(a[i].t);
        r.push([{ s: ' ' }, 's', ' ']);
    }
    r = r.concat(a[i].t);

    return r;
};

TRBL.prototype.getProperty = function() {
    return [{ s: this.name }, 'property', [{ s: this.name }, 'ident', this.name]];
};

TRBL.prototype.getString = function() {
    var p = this.getProperty(),
        v = this.getValue().slice(2),
        r = p[0].s + ':';

    for (var i = 0; i < v.length; i++) r += v[i][0].s;

    return r;
};
