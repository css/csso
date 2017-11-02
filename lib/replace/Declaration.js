var INDENT_PROPS = ['margin', 'padding'].reduce(function(ind, prop) {
    ind[prop] = true;

    // TLBR
    ['top', 'left', 'bottom', 'right'].forEach(function(side) {
        ind[prop + '-' + side] = true;
    });

    return ind;
}, {});

module.exports = function(node) {
    if (INDENT_PROPS.hasOwnProperty(node.property)) {
        // Zero-value workaround
        node.value.children.each(function(child) {
            if (child.value === '0') {
                child.type = 'Number';
            }
        });
    }
};
