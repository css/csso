module.exports = function cleanDeclartion(node) {
    if (node.value.sequence.isEmpty()) {
        return null;
    }
};
