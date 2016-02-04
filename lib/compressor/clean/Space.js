function canCleanWhitespace(node, left) {
    switch (node.type) {
        case 'Important':
        case 'Nth':
            return true;

        case 'Operator':
            return node.value !== '+' && node.value !== '-';
    }

    if (left) {
        switch (node.type) {
            case 'Function':
            case 'Braces':
            case 'Url':
                return true;
        }
    }
}

module.exports = function cleanWhitespace(node, parent, list, item) {
    var prev = Array.isArray(list) ? list[item - 1] : item.prev && item.prev.data;
    var next = Array.isArray(list) ? list[item + 1] : item.next && item.next.data;
    var prevType = prev.type;
    var nextType = next.type;

    // See https://github.com/css/csso/issues/16
    if (prevType === 'Url' && nextType) {
        return;
    }

    // See https://github.com/css/csso/issues/165
    if (prevType === 'Braces' && nextType === 'Identifier') {
        return;
    }

    // See https://github.com/css/csso/issues/134
    if (prevType === 'Function' && (nextType === 'Function' || nextType === 'Hash')) {
        return;
    }

    // See https://github.com/css/csso/issues/228
    if (prevType === 'Braces' && nextType === 'Operator' && (next.value === '+' || next.value === '-')) {
        return;
    }

    if ((prevType === 'Identifier' && prev.name === '*') ||
        (nextType === 'Identifier' && next.name === '*')) {
        return null;
    }

    if (canCleanWhitespace(next, false) ||
        canCleanWhitespace(prev, true)) {
        return null;
    }
};
