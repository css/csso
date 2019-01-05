const fs = require('fs');
const path = require('path');

class JsonLocator {
    constructor(filename) {
        this.content = fs.readFileSync(filename, 'utf-8');
        this.filename = path.relative(path.join(__dirname, '/../..'), filename);
    }

    get(name) {
        const lines = this.content.split(`"${name}"`)[0].split('\n');
        return `${[
            this.filename,
            lines.length,
            lines.pop().length + name.length + 5
        ].join(':')} (${name})`;
    }
}

module.exports = JsonLocator;
