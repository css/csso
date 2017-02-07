module.exports = function cleanWhitespace(node, item, list) {
    if (node.value === '+' || node.value === '-') {
        return;
    }

    if (item.prev !== null && item.prev.data.type === 'Space') {
        list.remove(item.prev);
    }

    if (item.next !== null && item.next.data.type === 'Space') {
        list.remove(item.next);
    }
};
