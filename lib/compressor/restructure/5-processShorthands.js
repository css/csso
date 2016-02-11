var translate = require('../ast/translate');
var REPLACE = 1;

function processShorthand(item) {
    var shorthand = item.info;

    if (!shorthand.isOkToMinimize()) {
        return;
    }

    if (item.operation === REPLACE) {
        var shorterToken = {
            type: 'Declaration',
            info: {},
            property: shorthand.getProperty(),
            value: shorthand.getValue()
        };
        shorterToken.info.s = translate(shorterToken);
        item.item.data = shorterToken;
    } else {
        item.block.remove(item.item);
    }
}

module.exports = function processShorthands(shortDeclarations) {
    shortDeclarations.forEach(processShorthand);
};
