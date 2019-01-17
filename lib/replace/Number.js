const OMIT_PLUSSIGN = /^(?:\+|(-))?0*(\d*)(?:\.0*|(\.\d*?)0*)?$/;
const KEEP_PLUSSIGN = /^([+-])?0*(\d*)(?:\.0*|(\.\d*?)0*)?$/;
const unsafeToRemovePlusSignAfter = {
    Dimension: true,
    HexColor: true,
    Identifier: true,
    Number: true,
    Raw: true,
    UnicodeRange: true
};

function packNumber(value, item) {
    // omit plus sign only if no prev or prev is safe type
    const regexp = item && item.prev !== null && Object.prototype.hasOwnProperty.call(unsafeToRemovePlusSignAfter, item.prev.data.type) ?
        KEEP_PLUSSIGN :
        OMIT_PLUSSIGN;

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
}

module.exports = (node, item) => {
    node.value = packNumber(node.value, item);
};

module.exports.pack = packNumber;
