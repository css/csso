module.exports = function cleanAtrule(node, item, list) {
    if (node.block) {
        // otherwise removed at-rule don't prevent @import for removal
        if (this.stylesheet !== null) {
            this.stylesheet.firstAtrulesAllowed = false;
        }

        if (node.block.children.isEmpty()) {
            list.remove(item);
            return;
        }
    }

    switch (node.name) {
        case 'charset':
            if (!node.expression || node.expression.children.isEmpty()) {
                list.remove(item);
                return;
            }

            // if there is any rule before @charset -> remove it
            if (item.prev) {
                list.remove(item);
                return;
            }

            break;

        case 'import':
            if (this.stylesheet === null || !this.stylesheet.firstAtrulesAllowed) {
                list.remove(item);
                return;
            }

            // if there are some rules that not an @import or @charset before @import
            // remove it
            list.prevUntil(item.prev, function(rule) {
                if (rule.type === 'Atrule') {
                    if (rule.name === 'import' || rule.name === 'charset') {
                        return;
                    }
                }

                this.root.firstAtrulesAllowed = false;
                list.remove(item);
                return true;
            }, this);

            break;
    }
};
