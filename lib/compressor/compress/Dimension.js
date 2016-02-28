var packNumber = require('./Number.js').pack;
var NON_LENGTH_UNIT = {
    'deg': true,
    'grad': true,
    'rad': true,
    'turn': true,
    's': true,
    'ms': true,
    'Hz': true,
    'kHz': true,
    'dpi': true,
    'dpcm': true,
    'dppx': true
};

module.exports = function compressDimension(node, item) {
    var value = packNumber(node.value);
    var unit = node.unit;

    node.value = value;

    if (value === '0' && this.declaration && !NON_LENGTH_UNIT.hasOwnProperty(unit)) {
        // issue #200: don't remove units in flex property as it could change value meaning
        if (this.declaration.property.name === 'flex') {
            return;
        }

        // issue #222: don't remove units inside calc
        if (this['function'] && this['function'].name === 'calc') {
            return;
        }

        item.data = {
            type: 'Number',
            info: node.info,
            value: value
        };
    }
};
