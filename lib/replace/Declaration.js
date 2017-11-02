var INDENT_PROPS = {
    'margin': true,
    'padding': true
};

module.exports = function(node) {
    var shortPropertyName = node.property.split('-')[0];

    if (INDENT_PROPS.hasOwnProperty(shortPropertyName)) {
        // Zero-value workaround
        node.value.children.each(function(child) {
            if (child.value === '0') {
                child.type = 'Number';
            }
        });
    }
};
