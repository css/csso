/**
 * @namespace CSS минимизатор.
 */
var $cssm = {

    /**
     * TODO:
     *
     * @param s
     */
    isComment: function(s) {
        return s.length > 3 && s.substr(0, 2) === '/*' && s.slice(-2) === '*/';
    },

    /**
     * TODO:
     *
     * @param tree
     */
    minimize: function(tree) {
        var nodes = [];

        $cssm.copyTree(tree, nodes);
        $cssm.processComments(nodes);
        $cssm._minimize(nodes);

        return { nodes: $cssm.restructure(nodes) };
    },

    /**
     * TODO:
     *
     * @param nodes
     */
    processComments: function(nodes) {
        var node, i = 0, j, c, t, mode = { protect: false, order: false };

        for (; i < nodes.length; i++) {
            node = nodes[i];
            if (typeof node === 'string') {
                $cssm.checkMode(node, mode);
                nodes.splice(i, 1);
                i--;
            } else {
                if (node.value.length) {
                    node.value.forEach(function(value) {
                        $cssm.cleanComments(value);
                    });
                }
                if (node.content.length) {
                    for (j = 0; j < node.content.length; j++) {
                        c = node.content[j];
                        if (typeof c === 'string') {
                            $cssm.checkMode(c, mode);
                            if (!mode.protect && c === '/*p*/') {
                                if ((t = node.content[j + 1]) !== undefined && typeof t !== 'string') t.protect = true;
                            } else if (!mode.order && c === '/*o*/') {
                                if ((t = node.content[j + 1]) !== undefined && typeof t !== 'string') t.order = true;
                            }

                            node.content.splice(j, 1);
                            j--;
                        } else {
                            if (mode.protect) c.protect = true;
                            if (!mode.order && !c.order) c.n = c.n - 1000000;
                            $cssm.cleanComments(c.name);
                            $cssm.cleanComments(c.value);
                        }
                    }
                }
                if (node.nodes && node.nodes.length) $cssm.processComments(node.nodes);
            }
        }
    },

    /**
     * TODO:
     *
     * @param s
     * @param mode
     */
    checkMode: function(s, mode) {
        switch (s) {
            case '/*p<*/':
                mode.protect = true;
                break;
            case '/*>p*/':
                mode.protect = false;
                break;
            case '/*o<*/':
                mode.order = true;
                break;
            case '/*>o*/':
                mode.order = false;
                break;
        }
    },

    /**
     * TODO:
     *
     * @param tokens
     */
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

    /**
     * TODO:
     *
     * @param nodes
     */
    _minimize: function(nodes) {
        var i, node;

        for (i = 0; i < nodes.length; i++) {
            node = nodes[i];
            if (node.type === 'ruleset') {
                node.value.forEach(function(value) {
                    $cssm.minTokens(value); // exclude URLs, etc
                });
                node.content.forEach(function(d) {
                    $cssm.minTokens(d.value); // exclude URLs, etc
                    if (d.name.join() === 'font-weight') $cssm.minFontWeight(d.value);
                });
            } else if (node.type === 'atrule' && node.value[1] === 'media') {
                $cssm._minimize(node.nodes);
            }

            if (node.nodes.length) $cssm._minimize(node.nodes);
        }
    },

    /**
     * TODO:
     *
     * @param src
     * @param dst
     */
    copyTree: function(src, dst) {
        var r = dst || [], t,
            skipCharset = false,
            node,
            n = 1,
            i = 0;

        for (; i < src.nodes.length; i++) {
            node = src.nodes[i];
            if (typeof node === 'string') {
                r.push(node);
            } else if ($cssm.isContentNode(node)) {
                if (node.value.length && node.content.length) {
                    t = { type: node.type, value: node.value.slice(), content: [], nodes: [] };
                    node.content.forEach(function(d) {
                        if (typeof d === 'string') t.content.push(d);
                        else if (d.name.length && d.value.length) t.content.push({ name: d.name.slice(), value: d.value.slice(), important: d.important, n: n++ });
                    });
                    r.push(t);
                    skipCharset = true;
                }
            } else {
                switch (node.value[1]) {
                    case 'charset':
                        if (!skipCharset) skipCharset = true;
                        else break;
                    case 'import':
                    case 'namespace':
                        if (!node.content.length && !node.nodes.length) {
                            r.push({ type: 'atrule', value: node.value.slice(), content: [], nodes: [] });
                            skipCharset = true;
                        }
                        break;
                    case 'media':
                        if (node.nodes.length) {
                            t = { type: 'atrule', value: node.value.slice(), content: [], nodes: $cssm.copyTree(node) };
                            r.push(t);
                            skipCharset = true;
                        }
                        break;
                }
            }
        }

        return r;
    },

    /**
     * TODO:
     *
     * @param tokens
     */
    minTokens: function(tokens) {
        $cssm.minNumbers(tokens);
        $cssm.minColors(tokens);
    },

    /**
     * TODO:
     *
     * @param tokens
     */
    minNumbers: function(tokens) {
        var allowed = { ' ': 1, ',': 1, '+': 1, '-': 1, '*': 1, '/': 1, '(': 1, ')': 1, '[': 1, ']': 1 };

        for (var i = 0, ct, pt; i < tokens.length; i++) {
            ct = tokens[i];
            pt = tokens[i - 1];
            if (ct === '(' && (pt === 'url' || pt === 'expression')) i++;
            else {
                if (ct !== '.' && (pt === undefined || pt in allowed)) {
                    if (/^[0-9]+\.0*$/.test(ct)) ct = ct.replace(/\.0*$/, '');
                    if (/^0+[0-9]+(\.[0-9]*([a-z]{2}|%))?$/.test(ct)) ct = ct.replace(/^0+/, '');
                    if (/^[0-9]+\.0*([a-z]{2}|%)?$/.test(ct)) {
                        ct = ct.charAt(ct.length - 1) === '%' ?
                                ct.replace(/\.0*%$/, '%') :
                                ct.replace(/\.0*[a-z]{2}$/, ct.slice(-2));
                    }
                    if (/^0*\.?0*%$/.test(ct)) ct = '0%';
                    else if (/^0*\.?(0+)?$/.test(ct)) ct = '0';
                    else if (/^0*\.?0+[a-z]{2}$/.test(ct)) ct = '0';
                }
                if (/^0+\.[0-9]+([a-z]{2})?$/.test(ct)) ct = ct.slice(ct.indexOf('.'));
                tokens[i] = ct;
            }
        }
    },

    /**
     * TODO:
     *
     * @param tokens
     */
    minColors: function(tokens) {
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
        },
        i = 0,
        j, ct, pt, temp, temp2, rgb,
        recolh3 = /[0-9a-f][0-9a-f][0-9a-f]/,
        recolh6 = /[0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f]/,
        rergb = /^\(\d{1,3},\d{1,3},\d{1,3}\)$/;

        for (; i < tokens.length; i++) {
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

    /**
     * TODO:
     *
     * @param tokens
     */
    minFontWeight: function(tokens) {
        if (tokens[0] === 'normal') tokens[0] = '400';
        else if (tokens[0] === 'bold') tokens[0] = '700';
    },

    /**
     * TODO:
     *
     * @param nodes
     */
    restructure: function(nodes) {
        var i, j, k, t, node, indice = {}, s, bc, tn, chaos = [];

        // expand nodes
        for (i = nodes.length - 1; i !== -1; i--) {
            node = nodes[i];
            if (node.type === 'ruleset') {
                $cssm.expandShorthands(node.content);
                nodes = [].concat(nodes.slice(0, i), $cssm.expandNode(node), nodes.slice(i + 1));
            } else if (node.type === 'atrule' && (node.value[1] === 'font-face' || node.value[1] === 'page')) {
                $cssm.expandShorthands(node.content);
            }
        }

        // gather rulesets to join down
        for (i = nodes.length - 1; i !== -1; i--) {
            node = nodes[i];
            if (node.type === 'ruleset') {
                s = node.value[0].toString();
                if (s in indice) indice[s].push(i);
                else indice[s] = [i];
            } else {
                if (node.type === 'atrule') {
                    s = node.value.toString();
                    if (s in indice) indice[s].push(i);
                    else indice[s] = [i];
                }
            }
        }

        // join rulesets
        for (i in indice) {
            t = indice[i];
            node = nodes[t[0]];
            if ($cssm.isContentNode(node)) {
                for (j = t.length - 1; j !== 0; j--) {
                    node.content = nodes[t[j]].content.concat(node.content);
                    nodes[t[j]].remove = 1;
                }
            } else {
                for (j = t.length - 1; j !== 0; j--) nodes[t[j]].remove = 1;
            }
        }

        // remove obsolete rulesets and cleanup actual ones
        for (i = nodes.length - 1; i > -1; i--) {
            node = nodes[i];
            if (node.remove) nodes.splice(i, 1);
            else if ($cssm.isContentNode(node)) {
                node.content = $cssm.collapseShorthands(node.content);
                $cssm.prepareContent(node.content);
                if (!node.content.length) {
                    node.remove = 1;
                    i++;
                }
            }
        }

        $cssm.joinEqualNodes(nodes, false);

        indice = $cssm.collectIndice(nodes);

        for (i = nodes.length - 1; i !== -1; i--) {
            node = nodes[i];
            if (node.type === 'ruleset') {
                t = $cssm.sortDstNodes(nodes, indice, i);
                if (t !== -1) {
                    if (nodes[t].content.length < node.content.length) { // merge up
                        if ($cssm.joinValue(node.value).length < $cssm.getContentLength(nodes[t].content)) {
                            nodes[t].value = nodes[t].value.concat(node.value);
                            node.content = $cssm.excludeFromContent(node.content, nodes[t].content);
                            i++;
                        }
                    } else if (nodes[t].content.length === node.content.length) {
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

        indice = $cssm.collectIndice(nodes);
        t = {};
        for (i in indice) {
            j = indice[i].reverse();
            if (j.length > 1) {
                j = $cssm.possibleJoin(nodes, j);
                if (j.length) {
                    tn = $cssm.createNodeByKey(nodes, j, i);
                    if (tn) {
                        k = $cssm.joinValue(tn.v, true);
                        if (k in t) {
                            t[k].node.content = t[k].node.content.concat(tn.d);
                            t[k].indice = t[k].indice.concat(tn.indice);
                        } else t[k] = { node: { type: 'ruleset', value: tn.v, content: [tn.d], nodes: [] }, indice: tn.indice };
                    }
                }
            }
        }

        for (i in t) {
            node = t[i].node;
            if ($cssm.itWasCorrectJoin(node)) {
                chaos.push(node);
                $cssm.excludeFromNodes(node.content, nodes, t[i].indice);
            }
        }

        if (nodes[0] && nodes[0].type === 'atrule' && nodes[0].value[1] === 'charset') {
            nodes = nodes.splice(0, 1).concat(chaos, nodes);
        } else {
            nodes = chaos.concat(nodes);
        }

        // merge down
        for (i = 0; i < nodes.length; i++) {
            node = nodes[i];
            if (node.type === 'ruleset') {
                j = $cssm.nextNode(nodes, 'ruleset', i + 1);
                if (j !== -1 && nodes[j].content.length < node.content.length) {
                    t = $cssm.compareContent(nodes[j].content, node.content, false);
                    if (!t[0].length && $cssm.joinValue(node.value).length < $cssm.getContentLength(nodes[j].content)) {
                        nodes[j].value = node.value.concat(nodes[j].value);
                        node.content = $cssm.excludeFromContent(node.content, nodes[j].content);
                        i = j - 1;
                    }
                }
            }
        }

        $cssm.joinEqualNodes(nodes, true);

        $cssm.restoreOrder(nodes);

        // join by value once again
        // it is needed to collect rulesets after 'order' resorts
        for (i = 0; i < nodes.length; i++) {
            node = nodes[i];
            if (node.type === 'ruleset') {
                j = $cssm.nextNode(nodes, 'ruleset', i + 1);
                if (j !== -1 && $cssm.joinValue(node.value) === $cssm.joinValue(nodes[j].value)) {
                    node.content = node.content.concat(nodes[j].content);
                    nodes.splice(j, 1);
                    i--;
                }
            }
        }

        for (i = 0; i < nodes.length; i++) {
            if (nodes[i].type === 'atrule' && nodes[i].value[1] === 'media') nodes[i].nodes = $cssm.restructure(nodes[i].nodes);
        }

        return nodes;
    },

    /**
     * TODO:
     *
     * @param nodes
     */
    restoreOrder: function(nodes) {
        var i = 0, node;

        for (; i < nodes.length; i++) {
            node = nodes[i];
            if ($cssm.isContentNode(node)) node.content.sort($cssm.sortContentByN);
        }
    },

    /**
     * TODO:
     *
     * @param node
     */
    isContentNode: function(node) {
        return node.type === 'ruleset' || (node.type === 'atrule' && (node.value[1] === 'font-face' || node.value[1] === 'page'));
    },

    /**
     * TODO:
     *
     * @param nodes
     * @param ignoreOrder
     */
    joinEqualNodes: function(nodes, ignoreOrder) {
        var i, j, t, node, remove;

        for (i = 0; i < nodes.length; i++) {
            node = nodes[i];
            if (node.type === 'ruleset') {
                j = $cssm.nextNode(nodes, 'ruleset', i + 1);
                if (j !== -1) {
                    remove = false;
                    if (ignoreOrder) {
                        if ($cssm.isContentEqaul(node.content, nodes[j].content)) remove = true;
                    } else {
                        t = $cssm.compareContent(node.content, nodes[j].content, true);
                        if (!t[0].length && !t[1].length) {
                            t = $cssm.mergeContent(node.content, nodes[j].content);
                            if (remove = (t.length === node.content.length)) nodes[j].content = t;
                        }
                    }
                    if (remove) {
                        nodes[j].value = node.value.concat(nodes[j].value);
                        nodes.splice(i, 1);
                        i--;
                    }
                }
            }
        }
    },

    /**
     * TODO:
     *
     * @param content
     */
    expandShorthands: function(content) {
        var i, d, values = [];

        for (i = 0; i < content.length; i++) {
            d = content[i];
            if (!d.protect && d.n < 0 && (d.name[0] === 'margin' || d.name[0] === 'padding')) {
                values = d.value.join('').split(' ');
                values[1] === undefined && values.push(values[0]);
                values[2] === undefined && values.push(values[0]);
                values[3] === undefined && values.push(values[1]);
                content.splice(i, 1,
                    { name: [d.name[0] + '-top'], value: [values[0]], important: d.important, n: d.n },
                    { name: [d.name[0] + '-right'], value: [values[1]], important: d.important, n: d.n },
                    { name: [d.name[0] + '-bottom'], value: [values[2]], important: d.important, n: d.n },
                    { name: [d.name[0] + '-left'], value: [values[3]], important: d.important, n: d.n }
                );
            }
        }
    },

    /**
     * TODO:
     *
     * @param content
     */
    collapseShorthands: function(content) {
        var names = {
                'margin': { 'margin-top': 0, 'margin-right': 1, 'margin-bottom': 2, 'margin-left': 3 },
                'padding': { 'padding-top': 0, 'padding-right': 1, 'padding-bottom': 2, 'padding-left': 3 }
            },
            r = [];

        function _collapseShorthand(name, important) {
            var i = 0, d, v = [null, null, null, null], hasTRBL = false, n = -1000000, t;

            for (; i < content.length; i++) {
                d = content[i];
                if (!d.protect && d.n < 0 && d.important === important && d.name[0] in names[name]) {
                    v[names[name][d.name[0]]] = d.value[0];
                    if (d.n > n) n = d.n;
                    hasTRBL = true;
                    content.splice(i, 1);
                    i--;
                }
            }

            if (hasTRBL) {
                if (v[0] !== null && v[1] !== null && v[2] !== null && v[3] !== null) {
                    t = [];
                    if (v[3] === v[1]) v.length--;
                    if (v.length === 3 && v[2] === v[0]) v.length--;
                    if (v.length === 2 && v[1] === v[0]) v.length--;
                    for (i = 0; i < v.length - 1; i++) t.push(v[i]), t.push(' ');
                    t.push(v.slice(-1)[0]);
                    r.push({ name: [name], value: t, important: important, n: n });
                } else {
                    for (i in names[name]) {
                        t = names[name][i];
                        if (v[t] !== null) r.push({ name: [i], value: [v[t]], important: important, n: n });
                    }
                }
            }
        }

        _collapseShorthand('margin', true);
        _collapseShorthand('margin', false);
        _collapseShorthand('padding', true);
        _collapseShorthand('padding', false);

        if (r.length) {
            r = r.concat(content);
            r.sort($cssm.sortContentByN);
            return r;
        } else return content;
    },

    /**
     * TODO:
     *
     * @param content
     * @param nodes
     * @param indice
     */
    excludeFromNodes: function(content, nodes, indice) {
        var t = {}, i, j;

        for (i = 0; i < indice.length; i++) {
            j = indice[i];
            if (!(j in t)) {
                t[j] = 1;
                nodes[j].content = $cssm.excludeFromContent(nodes[j].content, content);
            }
        }
    },

    /**
     * TODO:
     *
     * @param node
     */
    itWasCorrectJoin: function(node) {
        var l = 0, i;

        for (i = 0; i < node.content.length; i++) {
            l += node.content[i].key.length;
        }

        return $cssm.joinValue(node.value).length < l;
    },

    /**
     * TODO:
     *
     * @param nodes
     * @param indice
     * @param key
     */
    createNodeByKey: function(nodes, indice, key) {
        var decl, i, j, node, value = [], t, decls = [], skip, n = -1000000;

        for (i = 0; i < indice.length; i++) {
            node = nodes[indice[i]];
            skip = false;
            for (j = 0; j < node.content.length; j++) {
                t = node.content[j];
                if (t.key === key) {
                    if (t.n < 0 || !skip) {
                        decls.push(indice[i]);
                        t.inUse = true;
                        n = t.n > n ? (decl = t, t.n) : n;
                    }
                    break;
                } else if (t.n > 0 && !t.inUse) skip = true;
            }
        }

        if (decls.length > 1) {
            for (i = 0; i < decls.length; i++) value = value.concat(nodes[decls[i]].value);
            return { v: value, d: decl, indice: decls };
        }

        return null;
    },

    /**
     * TODO:
     *
     * @param nodes
     * @param indice
     */
    possibleJoin: function(nodes, indice) {
        var r = [], i;

        for (i = 0; i < indice.length; i++) {
            if ($cssm.realContentLength(nodes[indice[i]].content) > 1) r.push(indice[i]);
        }

        return r.length > 1 ? r : [];
    },

    /**
     * TODO:
     *
     * @param content
     */
    realContentLength: function(content) {
        var l = 0, i;

        for (i = 0; i < content.length; i++) if (!content[i].inUse) l++;

        return l;
    },

    /**
     * TODO:
     *
     * @param nodes
     */
    collectIndice: function(nodes) {
        var indice = {}, i, j, t, node;

        for (i = nodes.length - 1; i !== -1; i--) {
            node = nodes[i];
            if (node.type === 'ruleset' && node.content.length >= 1) {
                for (j = 0; j < node.content.length; j++) {
                    t = node.content[j];
                    if (t.key in indice) indice[t.key].push(i);
                    else indice[t.key] = [i];
                }
            }
        }

        return indice;
    },

    /**
     * TODO:
     *
     * @param value
     * @param ordered
     */
    joinValue: function(value, ordered) {
        var s = '', i, t = [];

        if (ordered) {
            for (i = 0; i < value.length; i++) t.push(value[0].join(''));
            t.sort();
            return t.join(',');
        } else {
            for (i = 0; i < value.length; i++) s+= value[0].join('') + ',';
            return s.slice(0, -1);
        }
    },

    /**
     * TODO:
     *
     * @param c1
     * @param c2
     */
    excludeFromContent: function(c1, c2) {
        var r = [];

        for (var i = 0; i < c1.length; i++) {
            for (var j = 0; j < c2.length; j++) if (c1[i].key === c2[j].key) break;
            if (j === c2.length) r.push(c1[i]);
        }

        return r;
    },

    /**
     * TODO:
     *
     * @param node
     */
    getBestContent: function(node) {
        var i, t = 0, l0 = 0, l1 = 0;

        if (node.content.length === 1) return -1;
        if (node.content.length && node.content.slice(-1)[0].n > 0) return node.content.length - 1;

        for (i = 0; i < node.content.length; i++) if (node.content[i].key.length < node.content[t].key.length) t = i;
        for (i = 0; i < node.content.length; i++) if (i !== t) l0 += node.content[i].key.length;
        for (i = 0; i < node.value.length; i++) l1 += node.value[i].join('').length + 1; // selector.length + ','

        return l0 <= l1 ? -1 : t;
    },

    /**
     * TODO:
     *
     * @param nodes
     * @param indice
     * @param i
     */
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

    /**
     * TODO:
     *
     * @param c1
     * @param c2
     * @param both
     */
    compareContent: function(c1, c2, both) {
        var r = [ [], [] ], i, j, d1, d2;

        function _compare(c1, c2, a) {
            for (i = 0; i < c1.length; i++) {
                d1 = c1[i];
                for (j = 0; j < c2.length; j++) {
                    d2 = c2[j];
                    if (d1.key === d2.key && (d1.n < 0 || d2.n < 0 || d1.n === d2.n)) break;
                }
                if (j === c2.length) a.push(i);
            }
        }

        _compare(c1, c2, r[0]);
        both && _compare(c2, c1, r[1]);

        return r;
    },

    /**
     * TODO:
     *
     * @param c1
     * @param c2
     */
    isContentEqaul: function(c1, c2) {
        var i = 0;

        if (c1.length !== c2.length) return false;

        (c1 = c1.slice()).sort($cssm.sortContentByN);
        (c2 = c2.slice()).sort($cssm.sortContentByN);

        for (; i < c1.length; i++) if (c1[i].key !== c2[i].key) return false;

        return true;
    },

    /**
     * TODO:
     *
     * @param c1
     * @param c2
     */
    mergeContent: function(c1, c2) {
        var i = 0, j, r = [], d1, d2;

        if (c1.length !== c2.length) return [];

        for (; i < c1.length; i++) {
            d1 = c1[i];
            for (j = 0; j < c2.length; j++) {
                d2 = c2[j];
                if (d1.key === d2.key) {
                    if (d1.n < 0) r.push(d2);
                    else if (d2.n < 0 || d1.n === d2.n) r.push(d1);
                    break;
                }
            }
        }

        return r;
    },

    /**
     * TODO:
     *
     * @param nodes
     * @param type
     * @param i
     */
    prevNode: function(nodes, type, i) {
        for (; i !== -1; i--) if (nodes[i].type === type) return i;
        return -1;
    },

    /**
     * TODO:
     *
     * @param nodes
     * @param type
     * @param i
     */
    nextNode: function(nodes, type, i) {
        for (; i < nodes.length; i++) if (nodes[i].type === type) return i;
        return -1;
    },

    /**
     * TODO:
     *
     * @param node
     */
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

    /**
     * TODO:
     *
     * @param content
     */
    copyContent: function(content) {
        var r = [];

        content.forEach(function(d) {
            r.push({ name: d.name.slice(), value: d.value.slice(), important: d.important, n: d.n, protect: d.protect });
        });

        return r;
    },

    /**
     * TODO:
     *
     * @param content
     */
    prepareContent: function(content) {
        var ds = {}, d, i, n = 1;

        for (i = content.length - 1; i !== -1; i--) {
            d = content[i];
            if (d.name.length !== 1 || d.value.length === 0) content[i].remove = 1;
            else if (d.name in ds) {
                if (!content[ds[d.name]].important && d.important) {
                    content[ds[d.name]].remove = 1;
                    ds[d.name] = i;
                } else if (!d.protect) content[i].remove = 1;
            } else ds[d.name] = i;

            if (!content[i].remove) d.key = d.name.join('') + ':' + d.value.join('') + (d.important ? '!important' : '');
        }

        for (i = 0; i < content.length; i++) content[i].remove && (content.splice(i, 1), i--);

        content.sort($cssm.sortContentByN);

        for (i = 0; i < content.length; i++) if (content[i].n > 0) content[i].n = n++;
    },
    
    /**
     * TODO:
     *
     * @param content
     */
    getContentLength: function(content) {
        var l = 0, i = 0;
        for (; i < content.length; i++) l += content[i].key.length;
        return l;
    },

    /**
     * TODO:
     *
     * @param a
     * @param b
     */
    sortContentByN: function(a, b) {
        return a.n - b.n;
    }

};

if (typeof window === 'undefined') {
    exports.minimize = $cssm.minimize;
}