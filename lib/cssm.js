exports.minimize = function(tree) {
    var t = { nodes: [] };

    clean_copy(tree, t.nodes);
    _minimize(t.nodes);
    t = { nodes: restructure(t.nodes) };

    return t;
};

function _minimize(nodes) {
    nodes.forEach(function(node) {
        if (node.type === 'ruleset') {
            node.value.forEach(function(value) {
                min_tokens(value); // exclude URLs, etc
            });
            node.content.forEach(function(d) {
                min_tokens(d.value); // exclude URLs, etc
            });
        } else if (node.type === 'atrule' && node.value[1] === 'media') {
            _minimize(node.nodes);
        }

        if (node.nodes.length) _minimize(node.nodes);
    });
}

// remove invalid blocks (empty selectors / rulesets)
// remove invalid declarations (empty name / value)
// remove invalid atrules
function clean_copy(src, dst) {
    var r = dst || [], t,
        charset = false;

    src.nodes.forEach(function(node) {
        if (node.type === 'ruleset' || (node.type === 'atrule' && (node.value[1] === 'page' || node.value[1] === 'font-face'))) {
            if (node.value.length && node.content.length) {
                t = { type: node.type, value: node.value.slice(), content: [], nodes: [] };
                node.content.forEach(function(d) {
                    if (d.name && d.value.length) t.content.push({ name: d.name, value: d.value.slice(), important: d.important });
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
                        t = { type: 'atrule', value: node.value.slice(), content: [], nodes: clean_copy(node) };
                        r.push(t);
                    }
                    break;
            }
        }
    });

    return r;
}

function min_tokens(tokens) {
    min_numbers(tokens);
    min_colors(tokens);
}

function min_numbers(tokens) {
    for (var i = 0, ct; i < tokens.length; i++) {
        ct = tokens[i];

        if (/^0*\.?0*$/.test(ct)) tokens[i] = '0';
        else if (/^0*\.?0+[a-z]{2}$/.test(ct)) tokens[i] = '0' + ct.substr(ct.length - 2, 2);
    }
}

function min_colors(tokens) {
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
    }, i, j, value, temp, temp2, rgb,
    recolh3 = /[0-9a-f][0-9a-f][0-9a-f]/,
    recolh6 = /[0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f]/,
    rergb = /^\(\d{1,3},\d{1,3},\d{1,3}\)$/;

    for (i = 0; i < tokens.length; i++) {
        value = tokens[i];
        if (map[value]) dvalue[i] = map[value];
        else if (value === 'rgb') {
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
                        value = '#';
                    } else tokens.splice(i, 8, value + rgb);
                } else tokens.splice(i, 8, value + rgb);
            }
        }
        if (value === '#' && i < tokens.length - 1) {
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

// TODO: cleanup, comments
function restructure(nodes) {
    var i, j, t,
        sstore = {},
        dstore = {},
        skey, dkey,
        sso, dso,
        ntotal = 0, nlimit = 0,
        rsstore = {}, rdstore = {},
        r = [];

    // remove twin pairs
    nodes.forEach(function(node) {
        if (node.type === 'ruleset') {
            node.value.forEach(function(sel) {
                skey = sel.join('');
                sso = sstore[skey] || { s: sel, d: {}, dn: 0 };

                node.content.forEach(function(d) {
                    if (!(d.name in sso.d) || (d.name in sso.d && (!sso.d[d.name].important || d.important))) sso.d[d.name] = d;
                });

                sstore[skey] = sso;
            });
        } else if (node.type === 'atrule') {
            switch (node.value[1]) {
                case 'charset':
                case 'import':
                case 'namespace':
                    r.push(node);
                    break;
                case 'media':
                    r.push({ type: node.type, value: node.value, content: [], nodes: restructure(node.nodes) });
                    break;
            }
        }
    });

    // gather statistics and store original tokens
    for (skey in sstore) {
        sso = sstore[skey];
        rsstore[skey] = sso.s; // store tokens
        delete sso.s;

        for (t in sso.d) {
            dkey = t + ':' + sso.d[t].value.join();
            rdstore[dkey] = sso.d[t]; // store tokens

            dso = dstore[dkey] || { s: {}, sn: 0 };
            if (!dso.s[skey]) {
                dso.s[skey] = true;
                dso.sn++;
                ntotal++;
                nlimit++;
            }
            dstore[dkey] = dso;

            sso.d[dkey] = true;
            sso.dn++;
            nlimit++;

            delete sso.d[t];
        }
    }

    // calculate optimal blocks
    var result = [], first, n, darr, best;
    while (nlimit) {
        best = { l: 0, lr: 999999999 };
        first = sort_by_dn(sstore)[0];
        darr = sort_by_sn(first, sstore, dstore);

        for (i = darr.length - 1; i > -1; i--) {
            n = calc_string(darr, i, dstore);
            if (best.l <= n.l && best.lr > n.lr) best = n;
        }

        for (i = 0; i < best.s.length; i++) {
            skey = best.s[i];
            for (j = 0; j < best.d.length; j++) {
                dkey = best.d[j];
                delete sstore[skey].d[dkey];
                sstore[skey].dn--;
                if (sstore[skey].dn === 0) delete sstore[skey];
                delete dstore[dkey].s[skey];
                dstore[dkey].sn--;
                if (dstore[dkey].sn === 0) delete dstore[dkey];
                nlimit -= 2;
            }
        }

        result.push({ s: best.s, d: best.d });
    }

    // convert to tree
    result.forEach(function(node) {
        t = { type: 'ruleset', value: [], content: [], nodes: [] };
        node.s.forEach(function(s) {
            t.value.push(rsstore[s]);
        });
        node.d.forEach(function(d) {
            t.content.push(rdstore[d]);
        });
        r.push(t);
    });

    return r;
}

function sort_by_dn(sstore) {
    var arr = [];

    for (skey in sstore) arr.push(skey);

    arr.sort(function(a, b) {
        return sstore[b].dn - sstore[a].dn;
    });

    return arr;
}

function sort_by_sn(skey, sstore, dstore) {
    var arr = [],
        d = sstore[skey].d,
        dkey;

    for (dkey in d) arr.push(dkey);

    arr.sort(function(a, b) {
        return dstore[b].sn - dstore[a].sn;
    });

    return arr;
}

function calc_string(darr, n, dstore) {
    var i, j, s = {}, dso, skey, arr = [], nn = 0, dr = [];

    for (i = n; i > -1; i--) {
        nn += darr[i].length;
        dr.push(darr[i]);
        dso = dstore[darr[i]];
        for (skey in dso.s) {
            if (s[skey]) s[skey]++;
            else s[skey] = 1;
        }
    }

    for (skey in s) arr.push({s: skey, n: s[skey]});

    arr.sort(function(a, b) {
        return b.n - a.n;
    });

    for (i = 0, j = arr[i].n; i < arr.length && arr[i].n === j; i++);

    arr.length = i;

    for (j = 0; j < i; j++) arr[j] = arr[j].s;

    return { l: nn * arr.length + arr.join('').length * (n + 1),
             d: dr,
             s: arr,
             lr: dr.join('').length + arr.join('').length };
}
