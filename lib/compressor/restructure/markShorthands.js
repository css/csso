var unsafeToMerge = /vh|vw|vmin|vmax|vm|rem|\\9/;

var TOP = 0;
var RIGHT = 1;
var BOTTOM = 2;
var LEFT = 3;
var SIDES = ['top', 'right', 'bottom', 'left'];
var SIDE = {
    'margin-top': 'top',
    'margin-right': 'right',
    'margin-bottom': 'bottom',
    'margin-left': 'left',

    'padding-top': 'top',
    'padding-right': 'right',
    'padding-bottom': 'bottom',
    'padding-left': 'left',

    'border-top-color': 'top',
    'border-right-color': 'right',
    'border-bottom-color': 'bottom',
    'border-left-color': 'left',
    'border-top-width': 'top',
    'border-right-width': 'right',
    'border-bottom-width': 'bottom',
    'border-left-width': 'left',
    'border-top-style': 'top',
    'border-right-style': 'right',
    'border-bottom-style': 'bottom',
    'border-left-style': 'left'
};
var MAIN_PROPERTY = {
    'margin': 'margin',
    'margin-top': 'margin',
    'margin-right': 'margin',
    'margin-bottom': 'margin',
    'margin-left': 'margin',

    'padding': 'padding',
    'padding-top': 'padding',
    'padding-right': 'padding',
    'padding-bottom': 'padding',
    'padding-left': 'padding',

    'border-color': 'border-color',
    'border-top-color': 'border-color',
    'border-right-color': 'border-color',
    'border-bottom-color': 'border-color',
    'border-left-color': 'border-color',
    'border-width': 'border-width',
    'border-top-width': 'border-width',
    'border-right-width': 'border-width',
    'border-bottom-width': 'border-width',
    'border-left-width': 'border-width',
    'border-style': 'border-style',
    'border-top-style': 'border-style',
    'border-right-style': 'border-style',
    'border-bottom-style': 'border-style',
    'border-left-style': 'border-style'
};

function TRBL(name, important) {
    this.name = TRBL.extractMain(name);
    this.important = important ? 4 : 0;
    this.sides = {
        'top': null,
        'right': null,
        'bottom': null,
        'left': null
    };
}

TRBL.props = MAIN_PROPERTY;

TRBL.extractMain = function(name) {
    return MAIN_PROPERTY[name];
};

TRBL.prototype.impSum = function() {
    var sideCount = 0;
    var important = 0;

    for (var side in this.sides) {
        if (this.sides[side]) {
            sideCount++;
            if (this.sides[side].important) {
                important++;
            }
        }
    }

    return important === sideCount ? important : 0;
};

TRBL.prototype.add = function(name, sValue, tValue, important) {
    function add(token, str) {
        if (wasUnary) {
            var last = values[values.length - 1];
            last.t.push(token);
            last.s += str;
            wasUnary = false;
        } else {
            values.push({
                s: str,
                t: [token],
                important: important
            });
        }
    }

    var sides = this.sides;
    var side = SIDE[name];
    var wasUnary = false;
    var values = [];

    important = important ? 1 : 0;

    if (side) {
        if (side in sides) {
            var currentValue = sides[side];

            if (!currentValue || (important && !currentValue.important)) {
                sides[side] = {
                    s: important ? sValue.substring(0, sValue.length - 10) : sValue,
                    t: tValue[0][1] === 'unary'
                        ? [tValue[0], tValue[1]]
                        : [tValue[0]],
                    important: important
                };
            }

            return true;
        }
    } else if (name === this.name) {
        for (var i = 0; i < tValue.length; i++) {
            var child = tValue[i];

            switch (child[1]) {
                case 'unary':
                    add(child, child[2]);
                    wasUnary = true;
                    break;

                case 'number':
                case 'ident':
                    add(child, child[2]);
                    break;

                case 'percentage':
                    add(child, child[2][2] + '%');
                    break;

                case 'dimension':
                    add(child, child[2][2] + child[3][2]);
                    break;

                case 's':
                case 'comment':
                case 'important':
                    break;

                default:
                    return false;
            }
        }

        if (values.length > 4) {
            return false;
        }

        if (!values[RIGHT]) {
            values[RIGHT] = values[TOP];
        }
        if (!values[BOTTOM]) {
            values[BOTTOM] = values[TOP];
        }
        if (!values[LEFT]) {
            values[LEFT] = values[RIGHT];
        }

        for (var i = 0; i < 4; i++) {
            if (!sides[SIDES[i]] || (important && !sides[SIDES[i]].important)) {
                sides[SIDES[i]] = values[i];
            }
        }

        return true;
    }
};

TRBL.prototype.isOkToMinimize = function() {
    var top = this.sides.top;
    var right = this.sides.right;
    var bottom = this.sides.bottom;
    var left = this.sides.left;

    if (top && right && bottom && left) {
        if (unsafeToMerge.test([top.s, right.s, bottom.s, left.s].join(' '))) {
            return false;
        }

        var important = top.important +
                        right.important +
                        bottom.important +
                        left.important;

        return important === 0 || important === 4 || important === this.important;
    }

    return false;
};

TRBL.prototype.getValue = function() {
    var result = [{}, 'value'];
    var sides = this.sides;
    var values = [
        sides.top,
        sides.right,
        sides.bottom,
        sides.left
    ];

    if (sides.left.s === sides.right.s) {
        values.pop();
        if (sides.bottom.s === sides.top.s) {
            values.pop();
            if (sides.right.s === sides.top.s) {
                values.pop();
            }
        }
    }

    result = result.concat(values[TOP].t);
    for (var i = 1; i < values.length; i++) {
        result.push([{ s: ' ' }, 's', ' ']);
        result = result.concat(values[i].t);
    }

    if (this.impSum()) {
        result.push([{ s: '!important' }, 'important']);
    }

    return result;
};

TRBL.prototype.getProperty = function() {
    return [
        { s: this.name },
        'property',
        [{ s: this.name }, 'ident', this.name]
    ];
};

module.exports = function markShorthands(ruleset, parent) {
    var token = ruleset[3];
    var selector = ruleset[2][2][0].s;
    var freezeID = ruleset[0].freezeID || '';
    var shorts = parent[0].selectorsMap[selector].shorts;

    for (var i = token.length - 1; i >= 2; i--) {
        var child = token[i];

        if (child[1] === 'declaration') {
            var childInfo = child[0];
            var property = child[2][0].s;
            var value = child[3];
            var important = value[value.length - 1][1] === 'important';

            if (property in TRBL.props) {
                var key = freezeID + TRBL.extractMain(property);
                var shorthand = null;

                if (!this.lastShortSelector || selector === this.lastShortSelector) {
                    if (key in shorts) {
                        shorthand = shorts[key];
                        childInfo.removeByShort = true;
                    }
                }

                if (!shorthand) {
                    shorthand = new TRBL(property, important);
                    childInfo.replaceByShort = true;
                }

                shorthand.add(property, value[0].s, value.slice(2), important);

                shorts[key] = shorthand;
                this.shortDeclarations.push({
                    info: shorthand,
                    block: token,
                    declaration: child,
                    pos: i
                });

                this.lastShortSelector = selector;
            }
        }
    }
};
