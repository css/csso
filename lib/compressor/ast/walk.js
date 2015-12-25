function each(array, walker, parent) {
    for (var i = 0; i < array.length; i++) {
        var item = array[i];
        var result = walker.call(this, item, parent, array, i);

        if (result === null) {
            array.splice(i, 1);
            i--;
        } else if (result && result !== item) {
            array.splice(i, 1, result);
        }
    }
}

function eachRight(array, walker, parent) {
    for (var i = array.length - 1; i >= 0; i--) {
        var item = array[i];
        var result = walker.call(this, item, parent, array, i);

        if (result === null) {
            array.splice(i, 1);
        } else if (result && result !== item) {
            array.splice(i, 1, result);
        }
    }
}

function walkRules(node, parent, array, index) {
    switch (node.type) {
        case 'StyleSheet':
            each.call(this, node.rules, walkRules, node);
            break;

        case 'Atrule':
            if (node.block) {
                walkRules.call(this, node.block);
            }
            return this.fn(node, parent, array, index);

        case 'Ruleset':
            return this.fn(node, parent, array, index);
    }
}

function walkRulesRight(node, parent, array, index) {
    switch (node.type) {
        case 'StyleSheet':
            eachRight.call(this, node.rules, walkRulesRight, node);
            break;

        case 'Atrule':
            if (node.block) {
                walkRulesRight.call(this, node.block);
            }
            return this.fn(node, parent, array, index);

        case 'Ruleset':
            return this.fn(node, parent, array, index);
    }
}

function walkAll(node, parent, array, index) {
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

        case 'Argument':
        case 'AtruleExpression':
        case 'Braces':
        case 'Negation':
        case 'Value':
        case 'SimpleSelector':
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
        case 'Important': // remove
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

    return this.fn(node, parent, array, index);
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
