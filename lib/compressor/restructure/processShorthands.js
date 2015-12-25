var translate = require('../ast/translate');

function processShorthand(item) {
    var info = item.declaration.info;

    if (info.removeByShort || info.replaceByShort) {
        var shorthand = item.info;

        if (shorthand.isOkToMinimize()) {
            if (info.replaceByShort) {
                var shorterToken = {
                    type: 'Declaration',
                    info: {},
                    property: shorthand.getProperty(),
                    value: shorthand.getValue()
                };
                shorterToken.info.s = translate(shorterToken);
                item.block.splice(item.pos, 1, shorterToken);
            } else {
                item.block.splice(item.pos, 1);
            }
        }
    }
}

module.exports = function processShorthands(shortDeclarations) {
    shortDeclarations.forEach(processShorthand);
};
