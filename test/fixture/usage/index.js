const fs = require('fs');
const path = require('path');

const tests = {};

(function scan(dir) {
    fs.readdirSync(dir).forEach(filename => {
        const fullpath = path.join(dir, filename);

        // nested dir
        if (fs.statSync(fullpath).isDirectory()) {
            scan(fullpath);
            return;
        }

        let name = filename.replace(/(\.min)?\.css(\.usage)?$/, '');
        let key = 'source';

        if (/\.min\.css/.test(filename)) {
            key = 'compressed';
        } else if (/\.usage/.test(filename)) {
            key = 'usage';
        }

        // in case there is a filename that doesn't ends with `.css` or `.min.css`
        if (name !== filename) {
            name = path.relative(path.join(__dirname, '/../../..'), fullpath).replace(/(\.min)?\.css(\.usage)?$/, '.css');

            if (!tests[name]) {
                tests[name] = {};
            }

            tests[name][key] = fs.readFileSync(fullpath, 'utf8').trim();

            if (key === 'usage') {
                tests[name][key] = JSON.parse(tests[name][key]);
            }
        }
    });
})(__dirname);

module.exports = tests;
