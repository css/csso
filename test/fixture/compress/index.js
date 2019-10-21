var fs = require('fs');
var path = require('path');
var tests = {};

(function scan(dir) {
    fs.readdirSync(dir).forEach(function(filename) {
        var fullpath = path.join(dir, filename);

        // nested dir
        if (fs.statSync(fullpath).isDirectory()) {
            scan(fullpath);
            return;
        }

        var name = filename.replace(/(\.min)?\.css$/, '');
        var key = /\.min\.css/.test(filename) ? 'compressed' : 'source';

        // in case there is a filename that doesn't ends with `.css` or `.min.css`
        if (name !== filename) {
            name = path.relative(__dirname + '/../../..', fullpath).replace(/\.min\.css$/, '.css');

            if (!tests[name]) {
                tests[name] = {};
            }

            tests[name][key] = fs.readFileSync(fullpath, 'utf8').trim();

            if (key === 'source') {
                var match = tests[name][key].match(/\bcompress.options({.*?})/);
                if (match !== null) {
                    tests[name].options = JSON.parse(match[1]);
                }
            }
        }
    });
}(__dirname));

module.exports = tests;
