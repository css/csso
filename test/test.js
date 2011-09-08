var fs = require('fs'),
    csso = require('./../lib/cssoapi.js'),
    treeToString = csso.treeToString,
    cleanInfo = csso.cleanInfo,
    _parse = csso.parse,
    _translate = csso.translate,
    _compress = csso.compress,
    d_dir = __dirname + '/data',
    d_list = fs.readdirSync(d_dir),
    okn = total = 0;

var funcs = {
    'p': function parse(src, match) {
            return treeToString(cleanInfo(_parse(src, match)));
         },
    'l': function translate(src, match) {
            return _translate(cleanInfo(_parse(src, match)));
         },
    'cl': function translate(src, match) {
            return _translate(cleanInfo(_compress(_parse(src, match))));
         }
};

d_list.forEach(function(rule_dir) {
    if (/^test/.test(rule_dir)) {
        var rule = rule_dir.substring(5),
            path = d_dir + '/' + rule_dir + '/',
            list = fs.readdirSync(path),
            ext,
            files = {},
            k, a, b, c, src, t, r;

        list.forEach(function(f) {
            var i = f.lastIndexOf('.');

            if (i !== -1) {
                ext = f.substring(i + 1);
                k = f.substring(0, i);
                if (!(k in files)) files[k] = {};
                files[k][ext] = 1;
            }
        });

        for (k in files) {
            if (files[k].css) {
                src = readFile(path + k + '.css').trim();
                t = '\'' + rule + '\' / \'' + k + '.';
                for (a in funcs) {
                    if (a in files[k]) {
                        total++;
                        r = (((b = funcs[a](src, rule)) == (c = readFile(path + k + '.' + a).trim())));
                        r && okn++;
                        if (!r) {
                            console.log('FAIL: ' + t + a);
                        }
                    }
                }
            }
        }
    }
});

console.log('Total: ' + total + '. Ok: ' + okn + '. Fail: ' + (total - okn));

function readFile(path) {
    return fs.readFileSync(path).toString();
}
