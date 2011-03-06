var $cssoutils = {
    basic2string: function(nodes, tab) {
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
                s += $cssoutils.basic2string(node.nodes, tab + '    ');
            } else {
                if (node.content.length) {
                    s += ' {\n    ' + tab;
                    t = [];
                    node.content.forEach(function(d) {
                        t.push(d.name + ': ' + d.value.join('') + (d.important ? ' !important' : ''));
                    });
                    s += t.join(';\n    ' + tab);
                } else if (node.type === 'ruleset') s += ' {';
            }
            if (node.type === 'ruleset' || node.content.length || node.nodes.length) s += '\n' + tab + '}\n';
            else s += ';\n';
        });

        return s.slice(0, -1);
    },

    min2string: function(nodes) {
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
                s += $cssoutils.min2string(node.nodes);
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

        return s.trim();
    },

    dump2string: function(nodes, tab) {
        var s = '', t = [];
        if (tab === null || tab === undefined) tab = '';

        nodes.forEach(function(node) {
            t = [];
            s += (tab + 'type(' + node.type + ')\n');
            if (node.type === 'ruleset') {
                node.value.forEach(function(value) {
                    t.push('value(' + value.toString() + ')');
                });
                s += tab + t.toString();
            } else {
                s += tab + 'value(' + node.value.toString() + ')';
            }

            if (node.nodes.length) {
                s += '\n' + tab + '{\n';
                s += $cssoutils.dump2string(node.nodes, tab + '    ');
            } else {
                if (node.content.length) {
                    s += '\n' + tab + '{\n    ' + tab;
                    t = [];
                    node.content.forEach(function(d) {
                        t.push('name(' + d.name + '): value(' + d.value.join('') + (d.important ? ' !important' : '') + ')');
                    });
                    s += t.join(';\n    ' + tab);
                } else if (node.type === 'ruleset') s += ' {';
            }
            if (node.type === 'ruleset' || node.content.length || node.nodes.length) s += '\n' + tab + '}\n';
        });

        return s.charAt(s.length - 1) === '\n' ? s.slice(0, -1) : s;
    }
};

if (typeof window === 'undefined') {
    exports.basic2string = $cssoutils.basic2string;
    exports.min2string = $cssoutils.min2string;
    exports.dump2string = $cssoutils.dump2string;
}