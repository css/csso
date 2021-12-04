import { readdirSync, statSync, readFileSync } from 'fs';
import { join, relative } from 'path';

const __dirname = 'fixtures/usage';
const tests = {};

(function scan(dir) {
    readdirSync(dir).forEach(function(filename) {
        const fullpath = join(dir, filename);

        // nested dir
        if (statSync(fullpath).isDirectory()) {
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
            name = relative(__dirname + '/../../..', fullpath).replace(/(\.min)?\.css(\.usage)?$/, '.css');

            if (!tests[name]) {
                tests[name] = {};
            }

            tests[name][key] = readFileSync(fullpath, 'utf8').trim();

            if (key === 'usage') {
                tests[name][key] = JSON.parse(tests[name][key]);
            }
        }
    });
}(__dirname));

export default tests;
