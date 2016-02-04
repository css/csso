module.exports = function compressFont(value) {
    var list = value.sequence;

    list.eachRight(function(node, item) {
        if (node.type === 'Identifier') {
            if (node.name === 'bold') {
                item.data = {
                    type: 'Number',
                    info: value.info,
                    value: '700'
                };
            } else if (node.name === 'normal') {
                var prev = item.prev;

                if (prev && prev.data.type === 'Operator' && prev.data.value === '/') {
                    this.remove(prev);
                }

                return null;
            } else if (node.name === 'medium') {
                var next = item.next;

                if (!next || next.data.type !== 'Operator') {
                    return null;
                }
            }
        }
    });

    // remove redundant spaces
    list.each(function(node, item) {
        if (node.type === 'Space') {
            if (!item.prev || !item.next || item.next.data.type === 'Space') {
                return null;
            }
        }
    });

    if (list.isEmpty()) {
        list.append(list.createItem({
            type: 'Identifier',
            name: 'normal'
        }));
    }
};
