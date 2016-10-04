module.exports = function(node) {
    node.block.rules.each(function(rule) {
        rule.selector.selectors.each(function(simpleselector) {
            simpleselector.sequence.each(function(data, item) {
                if (data.type === 'Percentage' && data.value === '100') {
                    item.data = {
                        type: 'Type',
                        info: data.info,
                        name: 'to'
                    };
                } else if (data.type === 'Type' && data.name === 'from') {
                    item.data = {
                        type: 'Percentage',
                        info: data.info,
                        value: '0'
                    };
                }
            });
        });
    });
};
