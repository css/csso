function indent(num) {
    return new Array(num + 1).join('  ');
}

function escape(str) {
    return str
        .replace(/\\/g, '\\\\')
        .replace(/\r/g, '\\r')
        .replace(/\n/g, '\\n')
        .replace(/\t/g, '\\t')
        .replace(/"/g, '\\"');
}

module.exports = function stringify(val, level) {
    level = level || 0;

    if (typeof val == 'string') {
        return '"' + escape(val) + '"';
    }

    if (val && val.constructor === Object) {
        var body = Object.keys(val).map(function(k) {
            return indent(level + 1) + '"' + escape(k) + '": ' + stringify(val[k], level + 1);
        }).join(',\n');

        return '{' + (body ? '\n' + body + '\n' + indent(level) : '') + '}';
    }

    if (Array.isArray(val)) {
        var join = true;
        var body = val.map(function(item, idx) {
            var prefix = idx ? ' ' : '';

            if (Array.isArray(item) && (!join || !item.some(Array.isArray))) {
                prefix = '\n' + indent(level + 1);
                join = false;
            }

            return prefix + stringify(item, level + 1);
        }).join(',');

        if (/\n/.test(body)) {
            body =
                '\n' + indent(level + 1) +
                body +
                '\n' + indent(level);
        }

        return '[' + body + ']';
    }

    return String(val);
};
