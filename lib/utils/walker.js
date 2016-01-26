var offset;
var process;

function walk(token, parent, stack) {
    process(token, parent, stack);
    stack.push(token);

    switch (token[offset + 0]) {
        case 'simpleselector':
        case 'dimension':
        case 'selector':
        case 'property':
        case 'value':
        case 'filterv':
        case 'progid':
        case 'ruleset':
        case 'atruleb':
        case 'atrulerq':
        case 'atrulers':
        case 'stylesheet':
        case 'attrib':
        case 'important':
        case 'block':
        case 'atrules':
        case 'uri':
            for (var i = offset + 1; i < token.length; i++) {
                walk(token[i], token, stack);
            }
            break;

        case 'percentage':
        case 'clazz':
        case 'atkeyword':
        case 'pseudoe':
        case 'pseudoc':
            walk(token[offset + 1], token, stack);
            break;

        case 'declaration':
        case 'filter':
            walk(token[offset + 1], token, stack);
            walk(token[offset + 2], token, stack);
            break;

        case 'atruler':
            walk(token[offset + 1], token, stack);
            walk(token[offset + 2], token, stack);
            walk(token[offset + 3], token, stack);
            break;

        case 'braces':
            for (var i = offset + 3; i < token.length; i++) {
                walk(token[i], token, stack);
            }
            break;

        case 'nthselector':
            process(token[offset + 1], token, stack);
            for (var i = offset + 2; i < token.length; i++) {
                walk(token[i], token, stack);
            }
            break;

        case 'funktion':
            process(token[offset + 1], token, stack);
            process(token[offset + 2], token, stack);

            token = token[offset + 2];
            stack.push(token);
            for (var i = offset + 1; i < token.length; i++) {
                walk(token[i], token, stack);
            }
            stack.pop();
            break;
    }

    stack.pop();
}

module.exports = function(tree, fn, hasInfo) {
    offset = hasInfo ? 1 : 0;

    if (typeof fn === 'function') {
        process = fn;

        walk(tree, null, []);
    }
};
