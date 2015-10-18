function translate(node) {
    node.info.s = node.translate();
}

module.exports = {
    declaration: translate,
    property: translate,
    simpleselector: translate,
    filter: translate,
    value: translate,
    number: translate,
    percentage: translate,
    dimension: translate,
    ident: translate
};
