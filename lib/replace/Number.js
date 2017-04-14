var OMIT_PLUSSIGN = /^(?:\+|(-))?0*(\d*)(?:\.0*|(\.\d*?)0*)?$/;
var KEEP_PLUSSIGN = /^([\+\-])?0*(\d*)(?:\.0*|(\.\d*?)0*)?$/;
var unsafeToRemovePlusSignAfter = {
    Dimension: true,
    HexColor: true,
    Identifier: true,
    Number: true,
    Raw: true,
    UnicodeRange: true
};

function packNumber(value, prev) {
    // omit plus sign only if no prev or prev is safe type
    var regexp = prev === null || !unsafeToRemovePlusSignAfter.hasOwnProperty(prev.data.type)
        ? OMIT_PLUSSIGN
        : KEEP_PLUSSIGN;

    // 100 -> '100'
    // 00100 -> '100'
    // +100 -> '100' (only when safe, e.g. omitting plus sign for 1px+1px leads to single dimension instead of two)
    // -100 -> '-100'
    // 0.123 -> '.123'
    // 0.12300 -> '.123'
    // 0.0 -> ''
    // 0 -> ''
    // -0 -> '-'
    value = String(value).replace(regexp, '$1$2$3');

    if (value === '' || value === '-') {
        value = '0';
    }

    return value;
};

module.exports = function(node, item) {
    node.value = packNumber(node.value, item.prev);
};
module.exports.pack = packNumber;
