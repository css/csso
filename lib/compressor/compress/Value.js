var resolveName = require('css-tree').property;
var handlers = {
    'font': require('./property/font.js'),
    'font-weight': require('./property/font-weight.js'),
    'background': require('./property/background.js')
};

module.exports = function compressValue(node) {
    if (!this.declaration) {
        return;
    }

    var property = resolveName(this.declaration.property);

    if (handlers.hasOwnProperty(property.name)) {
        handlers[property.name](node);
    }
};
