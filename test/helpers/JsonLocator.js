const fs = require('fs');
const path = require('path');

function JsonLocator(filename) {
    this.content = fs.readFileSync(filename, 'utf-8');
    this.filename = path.relative(path.join(__dirname, '/../..'), filename);
}

JsonLocator.prototype.get = function(name) {
    const lines = this.content.split(`"${name}"`)[0].split('\n');
    return `${[
        this.filename,
        lines.length,
        lines.pop().length + name.length + 5
    ].join(':')} (${name})`;
};

module.exports = JsonLocator;
