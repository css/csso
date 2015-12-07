function compressFontWeight(node) {
    var value = node.sequence[0];

    if (value.type === 'Identifier') {
        switch (value.name) {
            case 'normal':
                node.sequence[0] = {
                    type: 'Number',
                    info: value.info,
                    value: '400'
                };
                break;
            case 'bold':
                node.sequence[0] = {
                    type: 'Number',
                    info: value.info,
                    value: '700'
                };
                break;
        }
    }
}

function compressFont(value) {
    var array = value.sequence;

    for (var i = array.length - 1; i >= 0; i--) {
        var node = array[i];

        if (node.type === 'Identifier') {
            if (node.name === 'bold') {
                array[i] = {
                    type: 'Number',
                    info: value.info,
                    value: '700'
                };
            } else if (node.name === 'normal') {
                var prev = i ? array[i - 1] : null;

                if (prev && prev.type === 'Operator' && prev.value === '/') {
                    array.splice(--i, 2);
                } else {
                    array.splice(i, 1);
                }
            } else if (node.name === 'medium') {
                var next = i < array.length - 1 ? array[i + 1] : null;

                if (!next || next.type !== 'Operator') {
                    array.splice(i, 1);
                }
            }
        }
    }

    // remove redundant spaces
    for (var i = 0; i < array.length; i++) {
        if (array[i].type === 'Space') {
            if (!i || i === array.length - 1 || array[i + 1].type === 'Space') {
                array.splice(i, 1);
                i--;
            }
        }
    }

    if (!array.length) {
        array.push({
            type: 'Identifier',
            name: 'normal'
        });
    }

    value.sequence = array;
}

function compressBackground(value) {
    function lastType() {
        if (buffer.length) {
            return buffer[buffer.length - 1].type;
        }
    }

    function flush() {
        if (lastType() === 'Space') {
            buffer.pop();
        }

        if (!buffer.length ||
            (buffer.length === 1 && buffer[0].type === 'Important')) {
            buffer.unshift(
                {
                    type: 'Number',
                    value: '0'
                },
                {
                    type: 'Space'
                },
                {
                    type: 'Number',
                    value: '0'
                }
            );
        }

        newValue.push.apply(newValue, buffer);

        buffer = [];
    }

    var newValue = [];
    var buffer = [];

    value.sequence.forEach(function(node) {
        if (node.type === 'Operator' && node.value === ',') {
            flush();
            newValue.push(node);
            return;
        }

        // remove defaults
        if (node.type === 'Identifier') {
            if (node.name === 'transparent' ||
                node.name === 'none' ||
                node.name === 'repeat' ||
                node.name === 'scroll') {
                return;
            }
        }

        // don't add redundant spaces
        if (node.type === 'Space' && (!buffer.length || lastType() === 'Space')) {
            return;
        }

        buffer.push(node);
    });

    flush();
    value.sequence = newValue;
}

module.exports = function compressValue(property, value) {
    if (!value.sequence.length) {
        return;
    }

    if (/background$/.test(property)) {
        compressBackground(value);
    } else if (/font$/.test(property)) {
        compressFont(value);
    } else if (/font-weight$/.test(property)) {
        compressFontWeight(value);
    }
};
