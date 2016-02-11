function each(list, walker, parent) {
    list.each(function(data, item) {
        walker.call(this, data, parent, list, item);
    }, this);
}

function eachRight(list, walker, parent) {
    list.eachRight(function(data, item) {
        walker.call(this, data, parent, list, item);
    }, this);
}

function walkRules(node, parent, list, item) {
    switch (node.type) {
        case 'StyleSheet':
            each.call(this, node.rules, walkRules, node);
            break;

        case 'Atrule':
            if (node.block) {
                walkRules.call(this, node.block);
            }
            this.fn(node, parent, list, item);
            break;

        case 'Ruleset':
            this.fn(node, parent, list, item);
            break;
    }
}

function walkRulesRight(node, parent, list, item) {
    switch (node.type) {
        case 'StyleSheet':
            eachRight.call(this, node.rules, walkRulesRight, node);
            break;

        case 'Atrule':
            if (node.block) {
                walkRulesRight.call(this, node.block);
            }
            this.fn(node, parent, list, item);
            break;

        case 'Ruleset':
            this.fn(node, parent, list, item);
            break;
    }
}

function walkAll(node, parent, list, item) {
    this.stack.push(node);

    switch (node.type) {
        case 'Atrule':
            if (node.expression) {
                walkAll.call(this, node.expression, node);
            }
            if (node.block) {
                walkAll.call(this, node.block, node);
            }
            break;

        case 'Declaration':
            walkAll.call(this, node.property, node);
            walkAll.call(this, node.value, node);
            break;

        case 'Attribute':
            walkAll.call(this, node.name, node);
            if (node.value) {
                walkAll.call(this, node.value, node);
            }
            break;

        case 'FunctionalPseudo':
        case 'Function':
            each.call(this, node.arguments, walkAll, node);
            break;

        case 'Block':
            each.call(this, node.declarations, walkAll, node);
            break;

        case 'Ruleset':
            if (node.selector) {
                walkAll.call(this, node.selector, node);
            }
            walkAll.call(this, node.block, node);
            break;

        case 'Selector':
            each.call(this, node.selectors, walkAll, node);
            break;

        case 'Value':
        case 'Argument':
        case 'AtruleExpression':
        case 'SimpleSelector':
        case 'Braces':
        case 'Negation':
            each.call(this, node.sequence, walkAll, node);
            break;

        case 'StyleSheet':
            each.call(this, node.rules, walkAll, node);
            break;

        case 'Url':
        case 'Progid':
            walkAll.call(this, node.value, node);
            break;

        case 'Property':
        case 'Combinator':
        case 'Dimension':
        case 'Hash':
        case 'Identifier':
        case 'Nth':
        case 'Class':
        case 'Id':
        case 'Percentage':
        case 'PseudoClass':
        case 'PseudoElement':
        case 'Space':
        case 'Number':
        case 'String':
        case 'Operator':
        case 'Raw':
            break;
    }

    this.stack.pop(node);

    this.fn(node, parent, list, item);
}

module.exports = {
    all: function(root, fn) {
        walkAll.call({
            fn: fn,
            root: root,
            stack: []
        }, root);
    },
    rules: function(root, fn) {
        walkRules.call({
            fn: fn,
            root: root,
            stack: []
        }, root);
    },
    rulesRight: function(root, fn) {
        walkRulesRight.call({
            fn: fn,
            root: root,
            stack: []
        }, root);
    }
};
