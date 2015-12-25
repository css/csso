module.exports = function compressFont(value) {
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
};
