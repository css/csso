module.exports = function cleanAtrule(node, parent, array, i) {
    if (node.block) {
        // otherwise removed at-rule don't prevent @import for removal
        this.root.firstAtrulesAllowed = false;

        if (node.block.type === 'Block' && !node.block.declarations.length) {
            return null;
        }

        if (node.block.type === 'StyleSheet' && !node.block.rules.length) {
            return null;
        }
    }

    switch (node.name) {
        case 'charset':
            if (!node.expression.sequence.length) {
                return null;
            }

            // if there is any rule before @charset -> remove it
            if (i) {
                return null;
            }

            break;

        case 'import':
            if (!this.root.firstAtrulesAllowed) {
                return null;
            }

            // if there are some rules that not an @import or @charset before @import
            // remove it
            for (i = i - 1; i >= 0; i--) {
                var rule = array[i];
                if (rule.type === 'Atrule') {
                    if (rule.name === 'import' || rule.name === 'charset') {
                        continue;
                    }
                }

                this.root.firstAtrulesAllowed = false;
                return null;
            }

            break;
    }
};
