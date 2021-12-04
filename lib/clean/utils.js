module.exports = {
    hasNoChildren(node) {
        return !node || !node.children || node.children.isEmpty;
    },
    isNodeChildrenList(node, list) {
        return node !== null && node.children === list;
    }
};
