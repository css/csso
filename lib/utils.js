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
                    t.push(d.name + ': ' + d.value.join(''));
                });
                s += t.join(';\n    ' + tab) + '\n';
            } else if (node.type === 'ruleset') s += ' {';
        }
        if (node.type === 'ruleset' || node.content.length || node.nodes.length) s += tab + '}\n';
        else s += ';\n';
    });

    return s;
};
