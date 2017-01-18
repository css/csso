module.exports = function(node) {
    node.block.children.each(function(rule) {
        rule.selector.children.each(function(simpleselector) {
            simpleselector.children.each(function(data, item) {
                if (data.type === 'Percentage' && data.value === '100') {
                    item.data = {
                        type: 'Type',
                        loc: data.loc,
                        name: 'to'
                    };
                } else if (data.type === 'Type' && data.name === 'from') {
                    item.data = {
                        type: 'Percentage',
                        loc: data.loc,
                        value: '0'
                    };
                }
            });
        });
    });
};
