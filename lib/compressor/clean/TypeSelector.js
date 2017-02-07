// remove useless universal selector
module.exports = function cleanType(node, item, list) {
    var name = item.data.name;

    // check it's a universal selector
    if (name.charAt(name.length - 1) !== '*') {
        return;
    }

    // remove when universal selector isn't last or before combinator
    if (item.next !== null && item.next.data.type !== 'Combinator') {
        list.remove(item);
    }
};
