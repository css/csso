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

module.exports = function compressDimension(node) {
    var value = node.number.value;
    var unit = node.unit.value;

    if (value === '0' && !NON_LENGTH_UNIT[unit]) {
        // issue #200: don't remove units in flex property as it could change value meaning
        if (node.parent.type === 'value' && node.parent.parent.property.name.value === 'flex') {
            return;
        }

        // issue #222: don't remove units inside calc
        var cursor = node.parent;
        while (cursor.type === 'braces' || cursor.type === 'functionBody') {
            cursor = cursor.parent;
            if (cursor.type === 'funktion' && cursor.name.value === 'calc') {
                return;
            }
        }

        node.replace(node.number.token);
    }
};
