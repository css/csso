exports.basic2string = function(nodes, tab) {
    var s = '', t = [];

    if (tab === null || tab === undefined) tab = '';

    nodes.forEach(function(node) {
        t = [];

        if (node.type === 'ruleset') {
            node.value.forEach(function(value) {
                t.push(value.join(''));
            });
            s += tab + t.join(', ');
        } else {
            s += tab + node.value.join('');
        }

        if (node.nodes.length) {
            s += ' {\n';
            s += exports.basic2string(node.nodes, tab + '    ');
        } else {
            if (node.content.length) {
                s += ' {\n    ' + tab;
                t = [];
                node.content.forEach(function(d) {
                    t.push(d.name + ': ' + d.value.join('') + (d.important ? ' !important' : ''));
                });
                s += t.join(';\n    ' + tab) + '\n';
            } else if (node.type === 'ruleset') s += ' {';
        }
        if (node.type === 'ruleset' || node.content.length || node.nodes.length) s += tab + '}\n';
        else s += ';\n';
    });

    return s;
};

exports.min2string = function(nodes) {
    var s = '', t = [];

    nodes.forEach(function(node) {
        t = [];

        if (node.type === 'ruleset') {
            node.value.forEach(function(value) {
                t.push(value.join(''));
            });
            s += t.join(',');
        } else {
            s += node.value.join('');
        }

        if (node.nodes.length) {
            s += '{';
            s += exports.min2string(node.nodes);
        } else {
            if (node.content.length) {
                s += '{';
                t = [];
                node.content.forEach(function(d) {
                    t.push(d.name + ':' + d.value.join('') + (d.important ? ' !important' : ''));
                });
                s += t.join(';');
            } else if (node.type === 'ruleset') s += '{';
        }
        if (node.type === 'ruleset' || node.content.length || node.nodes.length) s += '}';
        else s += ';';
    });

    return s;
};
