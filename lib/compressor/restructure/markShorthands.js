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
    function add(node, str) {
        values.push({
            s: str,
            node: node,
            important: important
        });
    }

    var sides = this.sides;
    var side = SIDE[name];
    var values = [];

    important = important ? 1 : 0;

    if (side) {
        if (side in sides) {
            var currentValue = sides[side];

            if (!currentValue || (important && !currentValue.important)) {
                sides[side] = {
                    s: important ? sValue.substring(0, sValue.length - 10) : sValue,
                    node: tValue[0],
                    important: important
                };
            }

            return true;
        }
    } else if (name === this.name) {
        for (var i = 0; i < tValue.length; i++) {
            var child = tValue[i];

            switch (child.type) {
                case 'Identifier':
                    add(child, child.name);
                    break;

                case 'Number':
                    add(child, child.value);
                    break;

                case 'Percentage':
                    add(child, child.value + '%');
                    break;

                case 'Dimension':
                    add(child, child.value + child.unit);
                    break;

                case 'Space':
                case 'Important':
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
    var result = {
        type: 'Value',
        info: {},
        sequence: []
    };
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

    result.sequence.push(values[TOP].node);
    for (var i = 1; i < values.length; i++) {
        result.sequence.push(
            { type: 'Space' },
            values[i].node
        );
    }

    if (this.impSum()) {
        result.sequence.push({ type: 'Important' });
    }

    return result;
};

TRBL.prototype.getProperty = function() {
    return {
        type: 'Property',
        info: { s: this.name },
        name: this.name
    };
};

module.exports = function markShorthands(ruleset, parent) {
    var declarations = ruleset.block.declarations;
    var selector = ruleset.selector.selectors[0].info.s;
    var freezeID = ruleset.info.freezeID || '';
    var shorts = parent.info.selectorsMap[selector].shorts;

    for (var i = declarations.length - 1; i >= 0; i--) {
        var child = declarations[i];

        if (child.type === 'Declaration') {
            var childInfo = child.info;
            var property = child.property.info.s;
            var value = child.value;
            var important = value.sequence[value.sequence.length - 1].type === 'Important';

            if (property in TRBL.props) {
                var key = freezeID + TRBL.extractMain(property);
                var shorthand = null;

                if (!parent.info.lastShortSelector || selector === parent.info.lastShortSelector) {
                    if (key in shorts) {
                        shorthand = shorts[key];
                        childInfo.removeByShort = true;
                    }
                }

                if (!shorthand) {
                    shorthand = new TRBL(property, important);
                    childInfo.replaceByShort = true;
                }

                shorthand.add(property, value.info.s, value.sequence.slice(0), important);

                shorts[key] = shorthand;
                parent.info.shortDeclarations.push({
                    info: shorthand,
                    block: declarations,
                    declaration: child,
                    pos: i
                });

                parent.info.lastShortSelector = selector;
            }
        }
    }
};
