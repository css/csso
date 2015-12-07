module.exports = function(node) {
    node.block.rules.forEach(function(ruleset) {
        ruleset.selector.selectors.forEach(function(simpleselector) {
            var array = simpleselector.sequence;

            for (var i = 0; i < array.length; i++) {
                var part = array[i];
                if (part.type === 'Percentage' && part.value === '100') {
                    array[i] = {
                        type: 'Identifier',
                        info: array[i].info,
                        name: 'to'
                    };
                } else if (part.type === 'Identifier' && part.name === 'from') {
                    array[i] = {
                        type: 'Percentage',
                        info: array[i].info,
                        value: '0'
                    };
                }
            }
        });
    });
};
