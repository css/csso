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
                info: {},
                property: shorthand.getProperty(),
                value: shorthand.getValue()
            });
        } else {
            item.block.remove(item.item);
        }
    });
};
