function translate(node) {
    node.info.s = node.translate();
}

module.exports = {
    simpleselector: translate,

    declaration: translate,
    property: translate,
    value: translate,
    filter: translate

    // filter: translate,
    // number: translate,
    // percentage: translate,
    // dimension: translate,
    // ident: translate
};
