function canCleanWhitespace(node, left) {
    switch (node.type) {
        case 'Space':
        case 'Block':
        case 'Decldelim':
        case 'Ruleset':
        case 'Declaration':
        case 'Atrule':
        case 'Important':
        case 'Nth':
        case 'Combinator':
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

function cleanWhitespace(node, parent, array, index) {
    var parentType = parent.type;
    var prev = index ? array[index - 1] : null;
    var next = index < array.length - 1 ? array[index + 1] : null;
    var prevType = prev ? prev.type : '';
    var nextType = next ? next.type : '';

    if (parentType !== 'AtruleExpression' || prevType) {

        // See https://github.com/css/csso/issues/16
        if (prevType === 'Url' && nextType) {
            return;
        }

        // See https://github.com/css/csso/issues/165
        if (parentType === 'AtruleExpression' && prevType === 'Braces' && nextType === 'Identifier') {
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

        if (nextType !== null && prevType !== null) {
            if ((prevType === 'Identifier' && prev.name === '*') ||
                (nextType === 'Identifier' && next.name === '*')) {
                return null;
            }

            if (canCleanWhitespace(next, false) ||
                canCleanWhitespace(prev, true)) {
                return null;
            }
        } else {
            return null;
        }
    }
}

module.exports = cleanWhitespace;
