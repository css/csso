module.exports = function cleanDeclartion(node, parent, list, item) {
    if (node.value.sequence.isEmpty()) {
        list.remove(item);
    }
};
