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

module.exports = function compressDimension(node, parent) {
    var value = packNumber(node.value);
    var unit = node.unit;

    node.value = value;

    if (value === '0' && !NON_LENGTH_UNIT[unit]) {
        // issue #200: don't remove units in flex property as it could change value meaning
        if (parent.type === 'Value' && this.stack[this.stack.length - 2].property.name === 'flex') {
            return;
        }

        // issue #222: don't remove units inside calc
        for (var i = this.stack.length - 1; i >= 0; i--) {
            var cursor = this.stack[i];
            if (cursor.type === 'Function' && cursor.name === 'calc') {
                return;
            }
            if (cursor.type !== 'Braces' && cursor.type !== 'Argument') {
                break;
            }
        }

        return {
            type: 'Number',
            info: node.info,
            value: value
        };
    }
};
