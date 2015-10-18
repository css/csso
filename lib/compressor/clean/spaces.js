// See https://github.com/css/csso/issues/16
function issue16(prevType, nextType) {
    return nextType && prevType === 'uri';
}

// See https://github.com/css/csso/issues/165
function issue165(prevType, nextType, parentType) {
    return parentType === 'atrulerq' && prevType === 'braces' && nextType === 'ident';
}

// See https://github.com/css/csso/issues/134
function issue134(prevType, nextType) {
    return prevType === 'funktion' && (nextType === 'funktion' || nextType === 'vhash');
}

function issue228(prevType, nextType) {
    return prevType === 'braces' && nextType === 'unary';
}

function _cleanWhitespace(type, left) {
    switch (type) {
        case 's':
        case 'operator':
        case 'attrselector':
        case 'block':
        case 'decldelim':
        case 'ruleset':
        case 'declaration':
        case 'atruleb':
        case 'atrules':
        case 'atruler':
        case 'important':
        case 'nth':
        case 'combinator':
            return true;
    }

    if (left) {
        switch (type) {
            case 'funktion':
            case 'braces':
            case 'uri':
                return true;
        }
    }
}

function cleanWhitespace(node) {
    var parentType = node.parent.type;
    var prev = node.prev;
    var next = node.next;
    var prevType = prev && prev.type;
    var nextType = next && next.type;

    if (nextType === 'unknown') {
        node.value = '\n';
    } else {
        if ((parentType !== 'atrulerq' || prevType) &&
            !issue16(prevType, nextType) &&
            !issue165(prevType, nextType, parentType) &&
            !issue134(prevType, nextType) &&
            !issue228(prevType, nextType)) {

            if (nextType !== null && prevType !== null) {
                if ((prevType === 'ident' && prev.value === '*') ||
                    (nextType === 'ident' && next.value === '*')) {
                    return node.remove();
                }

                if (_cleanWhitespace(nextType, false) ||
                    _cleanWhitespace(prevType, true)) {
                    return node.remove();
                }
            } else {
                return node.remove();
            }
        }

        node.value = ' ';
    }
}

module.exports = cleanWhitespace;
