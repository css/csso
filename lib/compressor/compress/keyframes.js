module.exports = function(node) {
    node.block.each(function(ruleset) {
        ruleset.selector.each(function(simpleselector) {
            simpleselector.each(function(part) {
                if (part.type === 'percentage' && part.value.value === '100') {
                    // 100% -> to
                    part.replace([{}, 'ident', 'to']);
                } else if (part.type === 'ident' && part.value === 'from') {
                    // from -> 0%
                    part.replace([{}, 'percentage', [{}, 'number', '0']]);
                }
            });
        });
    });
};
