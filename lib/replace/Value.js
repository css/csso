const resolveName = require('css-tree').property;

const handlers = {
    'font': require('./property/font'),
    'font-weight': require('./property/font-weight'),
    'background': require('./property/background'),
    'border': require('./property/border'),
    'outline': require('./property/border')
};

module.exports = function compressValue(node) {
    if (!this.declaration) {
        return;
    }

    const property = resolveName(this.declaration.property);

    if (Object.prototype.hasOwnProperty.call(handlers, property.basename)) {
        handlers[property.basename](node);
    }
};
