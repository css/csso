const packNumber = require('./Number').pack;

const PERCENTAGE_LENGTH_PROPERTY = {
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
    'bottom': true,
    'right': true,

    'background-position': true,
    'background-position-x': true,
    'background-position-y': true,
    'background-size': true,

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
    'border-top-right-radius': true
};

module.exports = function compressPercentage(node, item) {
    const value = packNumber(node.value, item);
    const property = this.declaration === null ? null : this.declaration.property;

    node.value = value;

    if (property !== null && Object.prototype.hasOwnProperty.call(PERCENTAGE_LENGTH_PROPERTY, property)) {
        if (value === '0') {
            item.data = {
                type: 'Number',
                loc: node.loc,
                value
            };
        }
    }
};
