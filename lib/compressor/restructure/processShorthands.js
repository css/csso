var translate = require('../../utils/translate');

function processShorthand(item) {
    var info = item.declaration[0];

    if (info.removeByShort || info.replaceByShort) {
        var shorthand = item.info;

        if (shorthand.isOkToMinimize()) {
            if (info.replaceByShort) {
                var shorterToken  = [{}, 'declaration', shorthand.getProperty(), shorthand.getValue()];
                shorterToken[0].s = translate(shorterToken, true);
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
