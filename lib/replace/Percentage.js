var packNumber = require('./Number').pack;
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

module.exports = function compressPercentage(node, item) {
    var value = packNumber(node.value, item);
    var decl = this.declaration !== null ? this.declaration.property : null;
    var fnName = this['function'] !== null ? this['function'].name : null;

    node.value = value;

    if (
        (decl !== null && PERCENTAGE_LENGTH_DELC.hasOwnProperty(decl)) ||
        (fnName !== null && PERCENTAGE_LENGTH_FN.hasOwnProperty(fnName))
    ) {
        if (value === '0') {
            item.data = {
                type: 'Number',
                loc: node.loc,
                value: value
            };
        }
    }
};
