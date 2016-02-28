var compressFont = require('./property/font.js');
var compressFontWeight = require('./property/font-weight.js');
var compressBackground = require('./property/background.js');

module.exports = function compressValue(node) {
    if (!this.declaration) {
        return;
    }

    var property = this.declaration.property.name;

    if (/background$/.test(property)) {
        compressBackground(node);
    } else if (/font$/.test(property)) {
        compressFont(node);
    } else if (/font-weight$/.test(property)) {
        compressFontWeight(node);
    }
};
