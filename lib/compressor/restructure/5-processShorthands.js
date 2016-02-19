var translate = require('../ast/translate');
var REPLACE = 1;

module.exports = function processShorthands(shortDeclarations, markDeclaration) {
    shortDeclarations.forEach(function(item) {
        var shorthand = item.info;

        if (!shorthand.isOkToMinimize()) {
            return;
        }

        if (item.operation === REPLACE) {
            item.item.data = markDeclaration({
                type: 'Declaration',
                info: {}, // should copy item.item.data.info,
                property: shorthand.getProperty(),
                value: shorthand.getValue(),
                id: 0,
                length: 0,
                fingerprint: null
            });
        } else {
            item.block.remove(item.item);
        }
    });
};
