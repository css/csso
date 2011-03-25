var $cssm = {

    isComment: function(s) {
        return s.length > 3 && s.substr(0, 2) === '/*' && s.slice(-2) === '*/';
    },

    minimize: function(tree) {
        var nodes = [];

        $cssm.clean_copy(tree, nodes);
        $cssm.processComments(nodes);
        $cssm._minimize(nodes);

        return { nodes: $cssm.restructure(nodes) };
    },

    processComments: function(nodes) {
        var node;
        for (var i = 0; i < nodes.length; i++) {
            node = nodes[i];
            if (typeof node === 'string') {
                nodes.splice(i, 1);
                i--;
            } else {
                if (node.value.length) {
                    node.value.forEach(function(value) {
                        $cssm.cleanComments(value);
                    });
                }
                if (node.content.length) {
                    for (var j = 0; j < node.content.length; j++) {
                        if (typeof node.content[j] === 'string') {
                            node.content.splice(j, 1);
                            j--;
                        } else {
                            $cssm.cleanComments(node.content[j].name);
                            $cssm.cleanComments(node.content[j].value);
                        }
                    }
                }
                if (node.nodes) $cssm.processComments(node.nodes);
            }
        }
    },

    cleanComments: function(tokens) {
        for (var i = 0; i < tokens.length; i++) {
            if ($cssm.isComment(tokens[i])) {
                if (tokens[i + 1] === ' ') tokens.splice(i + 1, 1);
                if (tokens[i - 1] === ' ') tokens.splice(i - 1, 1), i--;
                tokens[i] = ' ';
                if (i === tokens.length - 1 || i === 0) tokens.splice(i, 1);
            }
        }
    },

    _minimize: function(nodes) {
        nodes.forEach(function(node) {
            if (node.type === 'ruleset') {
                node.value.forEach(function(value) {
                    $cssm.min_tokens(value); // exclude URLs, etc
                });
                node.content.forEach(function(d) {
                    $cssm.min_tokens(d.value); // exclude URLs, etc
                    if (d.name.join() === 'font-weight') $cssm.min_fontweight(d.value);
                });
            } else if (node.type === 'atrule' && node.value[1] === 'media') {
                $cssm._minimize(node.nodes);
            }

            if (node.nodes.length) $cssm._minimize(node.nodes);
        });
    },

    // remove invalid blocks (empty selectors / rulesets)
    // remove invalid declarations (empty name / value)
    // remove invalid atrules
    clean_copy: function(src, dst) {
        var r = dst || [], t,
            charset = false;

        src.nodes.forEach(function(node) {
            if (typeof node === 'string') {
                r.push(node);
            } else if (node.type === 'ruleset' || (node.type === 'atrule' && (node.value[1] === 'page' || node.value[1] === 'font-face'))) {
                if (node.value.length && node.content.length) {
                    t = { type: node.type, value: node.value.slice(), content: [], nodes: [] };
                    node.content.forEach(function(d) {
                        if (typeof d === 'string') t.content.push(d);
                        else if (d.name.length && d.value.length) t.content.push({ name: d.name.slice(), value: d.value.slice(), important: d.important });
                    });
                    r.push(t);
                }
            } else {
                switch (node.value[1]) {
                    case 'charset':
                    case 'import':
                    case 'namespace':
                        if (!node.content.length && !node.nodes.length) {
                            r.push({ type: 'atrule', value: node.value.slice(), content: [], nodes: [] });
                        }
                        break;
                    case 'media':
                        if (node.nodes.length) {
                            t = { type: 'atrule', value: node.value.slice(), content: [], nodes: $cssm.clean_copy(node) };
                            r.push(t);
                        }
                        break;
                }
            }
        });

        return r;
    },

    min_tokens: function(tokens) {
        $cssm.min_numbers(tokens);
        $cssm.min_colors(tokens);
    },

    min_numbers: function(tokens) {
        var allowed = { ' ': 1, ',': 1, '+': 1, '-': 1, '*': 1, '/': 1, '(': 1, ')': 1, '[': 1, ']': 1 };

        for (var i = 0, ct, pt; i < tokens.length; i++) {
            ct = tokens[i];
            pt = tokens[i - 1];
            if (ct === '(' && (pt === 'url' || pt === 'expression')) i++;
            else {
                if (ct !== '.' && (pt === undefined || pt in allowed)) {
                    if (/^0*\.?(0+)?%$/.test(ct)) tokens[i] = '0%';
                    else if (/^0*\.?(0+)?$/.test(ct)) tokens[i] = '0';
                    else if (/^0*\.?0+[a-z]{2}$/.test(ct)) tokens[i] = '0' + ct.substr(ct.length - 2, 2);
                }
                ct = tokens[i];
                if (ct === '0px') tokens[i] = '0';
                if (/^0+\.[0-9]+([a-z]{2})?$/.test(ct)) tokens[i] = ct.slice(ct.indexOf('.'));
            }
        }
    },

    min_colors: function(tokens) {
        var map = {
            'yellow': '#ff0',
            'fuchsia': '#f0f',
            'white': '#fff',
            'black': '#000',
            'blue': '#00f',
            'aqua': '#0ff',
            '#f00': 'red',
            '#c0c0c0': 'silver',
            '#808080': 'gray',
            '#800000': 'maroon',
            '#800080': 'purple',
            '#008000': 'green',
            '#808000': 'olive',
            '#000080': 'navy',
            '#008080': 'teal'
        }, i, j, ct, pt, temp, temp2, rgb,
        recolh3 = /[0-9a-f][0-9a-f][0-9a-f]/,
        recolh6 = /[0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f]/,
        rergb = /^\(\d{1,3},\d{1,3},\d{1,3}\)$/;

        for (i = 0; i < tokens.length; i++) {
            ct = tokens[i];
            pt = tokens[i - 1];

            if (ct === '(' && (pt === 'url' || pt === 'expression')) i++;
            else {
                if (map[ct]) tokens[i] = map[ct];
                else if (ct === 'rgb') {
                    if (i + 7 < tokens.length) {
                        rgb = tokens.slice(i + 1, i + 8).join('');
                        if (rergb.test(rgb)) {
                            temp = '';
                            for (j = 2; j < 8; j += 2) {
                                temp2 = Number(tokens[i + j]).toString(16);
                                temp += temp2.length === 1 ? ('0' + temp2) : temp2;
                            }
                            if (temp.length === 6) {
                                tokens.splice(i, 8, '#', temp);
                                ct = '#';
                            } else tokens.splice(i, 8, ct + rgb);
                        } else tokens.splice(i, 8, ct + rgb);
                    }
                }
                if (ct === '#' && i < tokens.length - 1) {
                    temp = tokens[i + 1];
                    if (recolh6.test(temp)) {
                        if (temp.charAt(0) === temp.charAt(1) &&
                            temp.charAt(2) === temp.charAt(3) &&
                            temp.charAt(4) === temp.charAt(5)) {
                            temp = temp.charAt(0) + temp.charAt(2) + temp.charAt(4);
                        }
                        tokens.splice(i, 2, '#' + temp);
                        i--;
                    } else if (recolh3.test(temp)) {
                        tokens.splice(i, 2, '#' + temp);
                        i--;
                    }
                }
            }
        }
    },

    min_fontweight: function(tokens) {
        if (tokens[0] === 'normal') tokens[0] = '400';
        else if (tokens[0] === 'bold') tokens[0] = '700';
    },

    // TODO: make it faster
    restructure: function(nodes) {
        var i, j, t, node, indice = {}, s, bc;

        // expand nodes
        for (i = nodes.length - 1; i !== -1; i--) {
            node = nodes[i];
            if (node.type === 'ruleset') {
                nodes = [].concat(nodes.slice(0, i), $cssm.expandNode(node), nodes.slice(i + 1));
            }
        }

        // gather rulesets to join down
        for (i = nodes.length - 1; i !== -1; i--) {
            node = nodes[i];
            if (node.type === 'ruleset') {
                s = node.value[0].toString();
                if (s in indice) indice[s].push(i);
                else indice[s] = [i];
            }
        }

        // join rulesets
        for (i in indice) {
            t = indice[i];
            node = nodes[t[0]];
            for (j = t.length - 1; j !== 0; j--) {
                node.content = nodes[t[j]].content.concat(node.content);
                nodes[t[j]].remove = 1;
            }
        }

        // remove obsolete rulesets and cleanup actual ones
        for (i = 0; i < nodes.length; i++) {
            node = nodes[i];
            if (node.remove) nodes.splice(i, 1), i--;
            else if (node.type === 'ruleset') {
                node.l = $cssm.prepareContent(node.content);
                if (!node.content.length) node.remove = 1, i--;
            }
        }

        // join equal neighbors
        for (i = nodes.length - 1; i > 0; i--) {
            node = nodes[i];
            if (node.type === 'ruleset') {
                j = $cssm.prevNode(nodes, 'ruleset', i - 1);
                if (j !== -1) {
                    t = $cssm.compareContent(node.content, nodes[j].content, true);
                    if (!t[0].length && !t[1].length) {
                        nodes[j].value = nodes[j].value.concat(node.value);
                        nodes.splice(i, 1);
                        i = j + 1;
                    }
                }
            }
        }

        // store properties' indice
        indice = {};
        for (i = nodes.length - 1; i !== -1; i--) {
            node = nodes[i];
            if (node.type === 'ruleset' && node.content.length > 1) {
                for (j = 0; j < node.content.length; j++) {
                    t = node.content[j];
                    if (t.key in indice) indice[t.key].push(i);
                    else indice[t.key] = [i];
                }
            }
        }

        for (i = nodes.length - 1; i !== -1; i--) {
            node = nodes[i];
            if (node.type === 'ruleset' && node.content.length > 1) {
                t = $cssm.sortDstNodes(nodes, indice, i);
                if (t !== -1) {
                    if (nodes[t].content.length < node.content.length && node.value.join(',').length < nodes[t].l) {
                        nodes[t].value = nodes[t].value.concat(node.value);
                        node.content = $cssm.excludeFromContent(node.content, nodes[t].content);
                        i++;
                    } else {
                        if (t === $cssm.prevNode(nodes, 'ruleset', i - 1)) {
                            nodes[t].value = nodes[t].value.concat(node.value);
                            nodes.splice(i, 1);
                        } else {
                            bc = $cssm.getBestContent(node);
                            if (bc !== -1) {
                                nodes[t].value = nodes[t].value.concat(node.value);
                                node.content = [node.content[bc]];
                            }
                        }
                    }
                }
            }
        }

        for (i = 0; i < nodes.length; i++) {
            node = nodes[i];
            if (node.type === 'ruleset' && node.content.length > 1) {
                j = $cssm.nextNode(nodes, 'ruleset', i + 1);
                if (j !== -1 && nodes[j].content.length < node.content.length) {
                    t = $cssm.compareContent(nodes[j].content, node.content, false);
                    if (!t[0].length && node.value.join(',').length < nodes[j].l) {
                        nodes[j].value = node.value.concat(nodes[j].value);
                        node.content = $cssm.excludeFromContent(node.content, nodes[j].content);
                        i = j - 1;
                    }
                }
            }
        }

        for (i = 0; i < nodes.length; i++) {
            if (nodes[i].type === 'atrule' && nodes[i].value[1] === 'media') nodes[i].nodes = $cssm.restructure(nodes[i].nodes);
        }

        return nodes;
    },

    excludeFromContent: function(c1, c2) {
        var r = [];

        for (var i = 0; i < c1.length; i++) {
            for (var j = 0; j < c2.length; j++) if (c1[i].key === c2[j].key) break;
            if (j === c2.length) r.push(c1[i]);
        }

        return r;
    },

    findBestDst: function(nodes, node, dsts) {
        var i, t, bci;

        for (i = 0; i < dsts.length; i++) {
            t = $cssm.compareContent(node.content, nodes[dsts[i]], false);
            if (!t[0].length) {
                bci = $cssm.getBestContent(node);
                return bci === -1 ? null : { i: [dsts[i]], c: [node.content[bci]] };
            }
        }

        return null;
    },

    getBestContent: function(node) {
        var i, t = 0, l0 = 0, l1 = 0;

        for (i = 0; i < node.content.length; i++) if (node.content[i].key.length < node.content[t].key.length) t = i;
        for (i = 0; i < node.content.length; i++) if (i !== t) l0 += node.content[i].key.length;
        for (i = 0; i < node.value.length; i++) l1 += node.value[i].join('').length + 1; // selector.length + ','

        return l0 <= l1 ? -1 : t;
    },

    sortDstNodes: function(nodes, indice, i) {
        var r = [], t, content = nodes[i].content;

        for (var j = 0; j < content.length; j++) {
            t = indice[content[j].key];
            if (t) {
                for (var k = 0; k < t.length; k++) {
                    t[k] < i && nodes[t[k]].content.length <= content.length &&
                            r.indexOf(t[k]) === -1 && !$cssm.compareContent(nodes[t[k]].content, content, false)[0].length &&
                            r.push(t[k]);
                }
            }
        }

        r.sort(function(a, b) {
            return nodes[b].l - nodes[a].l;
        });

        return r.length ? r[0] : -1;
    },

    compareContent: function(c1, c2, both) {
        var r = [ [], [] ], i, j;

        function _compare(c1, c2, a) {
            for (i = 0; i < c1.length; i++) {
                for (j = 0; j < c2.length; j++) if (c1[i].key === c2[j].key) break;
                if (j === c2.length) a.push(i);
            }
        }

        _compare(c1, c2, r[0]);
        both && _compare(c2, c1, r[1]);

        return r;
    },

    prevNode: function(nodes, type, i) {
        for (; i !== -1; i--) if (nodes[i].type === type) return i;
        return -1;
    },

    nextNode: function(nodes, type, i) {
        for (; i < nodes.length; i++) if (nodes[i].type === type) return i;
        return -1;
    },

    expandNode: function(node) {
        var r = [], i;

        for (i = 0; i < node.value.length; i++) {
            r.push({ type: node.type,
                     value: [node.value[i].slice()],
                     content: $cssm.copyContent(node.content),
                     nodes: [] });
        }

        return r;
    },

    copyContent: function(content) {
        var r = [];

        content.forEach(function(d) {
            r.push({ name: d.name.slice(), value: d.value.slice(), important: d.important });
        });

        return r;
    },

    prepareContent: function(content) {
        var ds = {}, d, i, l = 0;

        for (i = content.length - 1; i !== -1; i--) {
            d = content[i];
            if (d.name.length !== 1 || d.value.length === 0) content[i].remove = 1;
            else if (d.name in ds) {
                if (!content[ds[d.name]].important && d.important) {
                    content[ds[d.name]].remove = 1;
                    ds[d.name] = i;
                    d.key = d.name.join('') + ':' + d.value.join('');
                } else content[i].remove = 1;
            } else {
                ds[d.name] = i;
                d.key = d.name.join('') + ':' + d.value.join('');
            }
        }

        for (i = 0; i < content.length; i++) {
            if (content[i].remove) content.splice(i, 1), i--;
            else l += content[i].key.length;
        }

        return l;
    }

};

if (typeof window === 'undefined') {
    exports.minimize = $cssm.minimize;
}