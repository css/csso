// remove useless universal selector
module.exports = function cleanIdentifier(node, item, list) {
    // remove when universal selector isn't last or before combinator
    if (item.next !== null && item.next.data.type !== 'Combinator') {
        list.remove(item);
    }
};
