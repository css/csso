module.exports = function(node, root) {
    var name = node.name.name.value;

    switch (name) {
        case 'charset':
            var hasNonSpace = node.findBefore(function(node) {
                return node.type !== 's';
            });

            if (hasNonSpace) {
                node.remove();
            }

            break;

        case 'import':
            if (!root.firstAtrulesAllowed) {
                node.remove();
                return;
            }

            var hasNonSpace = node.findBefore(function(node) {
                if (node.type === 's') {
                    return false;
                }

                if (node.type === 'atrules') {
                    var name = node.name.name.value;

                    if (name === 'import' || name === 'charset') {
                        return false;
                    }
                }

                return true;
            });

            if (hasNonSpace) {
                root.firstAtrulesAllowed = false;
                node.remove();
            }

            break;
    }
};
