function canCleanWhitespace(node, left) {
    if (node.type === 'Operator') {
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

module.exports = function cleanWhitespace(node, item, list) {
    var prev = item.prev && item.prev.data;
    var next = item.next && item.next.data;
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

    if (canCleanWhitespace(next, false) ||
        canCleanWhitespace(prev, true)) {
        list.remove(item);
        return;
    }
};
