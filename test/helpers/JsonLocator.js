import { readFileSync } from 'fs';
import { relative, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default class JsonLocator {
    constructor(filename) {
        this.content = readFileSync(filename, 'utf-8');
        this.filename = relative(__dirname + '/../..', filename);
    }

    get(name) {
        const lines = this.content.split('"' + name + '"')[0].split('\n');

        return [
            this.filename,
            lines.length,
            lines.pop().length + name.length + 5
        ].join(':') + ' (' + name + ')';
    }
};
