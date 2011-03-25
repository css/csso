var $cssoutils = {
    basic2string: function(nodes, tab) {
        var s = '', t = [];

        if (tab === null || tab === undefined) tab = '';

        nodes.forEach(function(node) {
            t = [];

            if (typeof node !== 'string') {
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
                            t.push(d.name.join('') + ': ' + d.value.join('') + (d.important ? ' !important' : ''));
                        });
                        s += t.join(';\n    ' + tab);
                    } else if (node.type === 'ruleset') s += ' {';
                }
                if (node.type === 'ruleset' || node.content.length || node.nodes.length) s += '\n' + tab + '}\n';
                else s += ';\n';
            }
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
                        t.push(d.name.join('') + ':' + d.value.join('') + (d.important ? ' !important' : ''));
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
            if (typeof node !== 'string') {
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
                            if (typeof d !== 'string') {
                                t.push('name(' + d.name.join(',') + '): value(' + d.value.join('') + (d.important ? ' !important' : '') + ')');
                            } else {
                                t.push('comment(' + d + ')');
                            }
                        });
                        s += t.join(';\n    ' + tab);
                    } else if (node.type === 'ruleset') s += ' {';
                    else s += '\n';
                }
                if (node.type === 'ruleset' || node.content.length || node.nodes.length) s += '\n' + tab + '}\n';
            } else {
                s += 'comment(' + node + ')\n';
            }
        });

        return s.charAt(s.length - 1) === '\n' ? s.slice(0, -1) : s;
    },

    // TODO: atrules
    getstat: function(nodes, stat) {
        var stat = stat || { selectors: {} },
            skey, dkey;

        nodes.forEach(function(node) {
            if (node.type === 'ruleset') {
                node.value.forEach(function(sel) {
                    skey = sel.join('');
                    sso = stat.selectors[skey] || {};

                    node.content.forEach(function(d) {
                        dkey = d.name + ': ' + d.value.join('') + (d.important ? ' !important' : '');
                        if (!sso[dkey]) sso[dkey] = 1;
                        else sso[dkey]++;
                    });

                    stat.selectors[skey] = sso;
                });
            }
        });

        return stat;
    },

    stat2string: function(stat) {
        var s = '', sel, dec, sa = [], da;

        for (sel in stat.selectors) sa.push(sel);
        sa.sort();

        for (var i = 0; i < sa.length; i++) {
            sel = sa[i];
            s += sel + ' {\n';
            
            da = [];
            for (dec in stat.selectors[sel]) da.push(dec);
            da.sort();

            for (var j = 0; j < da.length; j++) {
                dec = da[j];
                s += '    ' + dec + '; => ' + stat.selectors[sel][dec] + '\n';
            }
            s += '}\n';
        }

        return s;
    },

    getstatstring: function(nodes) {
        return $cssoutils.stat2string($cssoutils.getstat(nodes));
    }
};

if (typeof window === 'undefined') {
    exports.basic2string = $cssoutils.basic2string;
    exports.min2string = $cssoutils.min2string;
    exports.dump2string = $cssoutils.dump2string;
    exports.getstatstring = $cssoutils.getstatstring;
}