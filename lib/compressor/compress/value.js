function compressFontWeight(value) {
    value.each(function(node) {
        if (node.type === 'ident') {
            switch (node.value) {
                case 'normal':
                    node.replace([{}, 'number', '400']);
                    break;
                case 'bold':
                    node.replace([{}, 'number', '700']);
                    break;
            }
        }
    });
}

function compressFont(value) {
    value.eachRight(function(node) {
        if (node.type === 'ident') {
            if (node.value === 'bold') {
                node.replace([{}, 'number', '700']);
            } else if (node.value === 'normal') {
                var prev = node.prev;

                if (prev && prev.type === 'operator' && prev.value === '/') {
                    prev.remove();
                }

                node.remove();
            } else if (node.value === 'medium') {
                var next = node.next;

                if (!next || next.type !== 'operator') {
                    node.remove();
                }
            }
        }
    });

    value.each(function(node) {
        if (node.type === 's' && (!node.prev || !node.next || node.next.type === 's')) {
            node.remove();
        }
    });

    if (!value.length) {
        value.append([{}, 'ident', 'normal']);
    }
}

function compressBackground(value) {
    function lastType() {
        if (sequence.length) {
            return sequence[sequence.length - 1][1];
        }
    }

    function flush() {
        if (lastType() === 's') {
            sequence.pop();
        }

        if (!sequence.length ||
            (sequence.length === 1 && sequence[0][1] === 'important')) {
            sequence.unshift(
                [{}, 'number', '0'],
                [{}, 's', ' '],
                [{}, 'number', '0']
            );
        }

        newValue.push.apply(newValue, sequence);

        sequence = [];
    }

    var newValue = [value.info, 'value'];
    var sequence = [];

    value.each(function(node) {
        if (node.type === 'operator' && node.value === ',') {
            flush();
            newValue.push(node.token);
            return;
        }

        // remove defaults
        if (node.type === 'ident') {
            if (node.value === 'transparent' ||
                node.value === 'none' ||
                node.value === 'repeat' ||
                node.value === 'scroll') {
                return;
            }
        }

        // don't add redundant spaces
        if (node.type === 's' && (!sequence.length || lastType() === 's')) {
            return;
        }

        sequence.push(node.token);
    });

    flush();
    value.replace(newValue);
}

module.exports = function compressValue(property, value) {
    if (!value.length) {
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
