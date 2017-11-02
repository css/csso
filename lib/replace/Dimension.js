var packNumber = require('./Number').pack;
var LENGTH_UNIT = {
    // absolute length units
    'px': true,
    'mm': true,
    'cm': true,
    'in': true,
    'pt': true,
    'pc': true,

    // relative length units
    'em': true,
    'ex': true,
    'ch': true,
    'rem': true,

    // viewport-percentage lengths
    'vh': true,
    'vw': true,
    'vmin': true,
    'vmax': true,
    'vm': true
};
var PERCENTAGE_LENGTH_DELC = {
    'margin': true,
    'margin-top': true,
    'margin-left': true,
    'margin-bottom': true,
    'margin-right': true,

    'padding': true,
    'padding-top': true,
    'padding-left': true,
    'padding-bottom': true,
    'padding-right': true,

    'top': true,
    'left': true,
    'botton': true,
    'right': true,
    'position': true,

    '-webkit-mask-box-image': true,
    '-webkit-mask-position-x': true,
    '-webkit-mask-position-y': true,

    'background-position-x': true,
    'background-position-y': true,

    'border': true,
    'border-width': true,
    'border-top-width': true,
    'border-left-width': true,
    'border-bottom-width': true,
    'border-right-width': true,
    'border-image-width': true,

    'border-radius': true,
    'border-bottom-left-radius': true,
    'border-bottom-right-radius': true,
    'border-top-left-radius': true,
    'border-top-right-radius': true,

    'font-size': true,
    'grid-column-gap': true,
    'grid-row-gap': true,
    'letter-spacing': true,
    'offset-distance': true,
    'scroll-snap-points-x': true,
    'scroll-snap-points-y': true,
    'shape-margin': true,
    'text-indent': true,
    'transform-origin': true,
    'word-spacing': true
};

var PERCENTAGE_LENGTH_FN = {
    'inset': true,
    'polygon': true,
    'translate': true,
    'translate3d': true,
    'translateX': true,
    'translateY': true
};

module.exports = function compressDimension(node, item) {
    var value = packNumber(node.value, item);
    var decl = this.declaration !== null ? this.declaration.property : null;
    var fnName = this['function'] !== null ? this['function'].name : null;

    node.value = value;

    if (node.type === 'Percentage') {
        if (PERCENTAGE_LENGTH_DELC.hasOwnProperty(decl) || PERCENTAGE_LENGTH_FN.hasOwnProperty(fnName)) {
            // Zero-value workaround
            if (value === '0') {
                item.data = {
                    type: 'Number',
                    loc: node.loc,
                    value: value
                };
            }
        }
    } else if (value === '0' && decl !== null && this.atrulePrelude === null) {
        var unit = node.unit.toLowerCase();

        // only length values can be compressed
        if (!LENGTH_UNIT.hasOwnProperty(unit)) {
            return;
        }

        // issue #200: don't remove units in flex property as it could change value meaning
        if (decl === 'flex') {
            return;
        }

        // issue #222: don't remove units inside calc
        if (fnName === 'calc') {
            return;
        }

        item.data = {
            type: 'Number',
            loc: node.loc,
            value: value
        };
    }
};
