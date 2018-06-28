module.exports = function cleanDeclartion(node, item, list) {
    if (node && node.value && node.value.children && node.value.children.isEmpty()) {
        list.remove(item);
    }
};
