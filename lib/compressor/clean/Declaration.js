module.exports = function cleanDeclartion(node, item, list) {
    if (node.value.children.isEmpty()) {
        list.remove(item);
    }
};
