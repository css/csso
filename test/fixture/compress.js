import { readdirSync, statSync, readFileSync } from 'fs';
import { join, relative, resolve } from 'path';

const __dirname = resolve(new URL(import.meta.url).pathname, '../../../fixtures/compress');
const tests = {};

(function scan(dir) {
    readdirSync(dir).forEach(function(filename) {
        var fullpath = join(dir, filename);

        // nested dir
        if (statSync(fullpath).isDirectory()) {
            scan(fullpath);
            return;
        }

        const key = /\.min\.css/.test(filename) ? 'compressed' : 'source';
        let name = filename.replace(/(\.min)?\.css$/, '');

        // in case there is a filename that doesn't ends with `.css` or `.min.css`
        if (name !== filename) {
            name = relative(__dirname + '/../../..', fullpath).replace(/\.min\.css$/, '.css');

            if (!tests[name]) {
                tests[name] = {};
            }

            tests[name][key] = readFileSync(fullpath, 'utf8').trim();

            if (key === 'source') {
                const match = tests[name][key].match(/\bcompress.options({.*?})/);

                if (match !== null) {
                    tests[name].options = JSON.parse(match[1]);
                }
            }
        }
    });
}(__dirname));

export default tests;
