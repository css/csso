// remove white spaces around operators when safe
module.exports = function cleanWhitespace(node, item, list) {
    if (node.value === '+' || node.value === '-') {
        return;
    }

    if (item.prev !== null && item.prev.data && item.prev.data.type && item.prev.data.type === 'WhiteSpace') {
        list.remove(item.prev);
    }

    if (item.next !== null && item.next.data && item.next.data.type && item.next.data.type === 'WhiteSpace') {
        list.remove(item.next);
    }
};
