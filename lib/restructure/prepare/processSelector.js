const { generate } = require('css-tree');
const specificity = require('./specificity');

const { hasOwnProperty } = Object.prototype;

const nonFreezePseudoElements = {
    'first-letter': true,
    'first-line': true,
    'after': true,
    'before': true
};
const nonFreezePseudoClasses = {
    'link': true,
    'visited': true,
    'hover': true,
    'active': true,
    'first-letter': true,
    'first-line': true,
    'after': true,
    'before': true
};

module.exports = function freeze(node, usageData) {
    const pseudos = Object.create(null);
    let hasPseudo = false;

    node.prelude.children.each(simpleSelector => {
        let tagName = '*';
        let scope = 0;

        simpleSelector.children.each(node => {
            switch (node.type) {
                case 'ClassSelector':
                    if (usageData && usageData.scopes) {
                        const classScope = usageData.scopes[node.name] || 0;

                        if (scope !== 0 && classScope !== scope) {
                            throw new Error(`Selector can't has classes from different scopes: ${generate(simpleSelector)}`);
                        }

                        scope = classScope;
                    }

                    break;

                case 'PseudoClassSelector': {
                    const name = node.name.toLowerCase();

                    if (!hasOwnProperty.call(nonFreezePseudoClasses, name)) {
                        pseudos[name] = true;
                        hasPseudo = true;
                    }

                    break;
                }

                case 'PseudoElementSelector': {
                    const name = node.name.toLowerCase();

                    if (!hasOwnProperty.call(nonFreezePseudoElements, name)) {
                        pseudos[name] = true;
                        hasPseudo = true;
                    }

                    break;
                }

                case 'TypeSelector':
                    tagName = node.name.toLowerCase();
                    break;

                case 'AttributeSelector':
                    if (node.flags) {
                        pseudos[`[${node.flags.toLowerCase()}]`] = true;
                        hasPseudo = true;
                    }

                    break;

                case 'WhiteSpace':
                case 'Combinator':
                    tagName = '*';
                    break;
            }
        });

        simpleSelector.compareMarker = specificity(simpleSelector).toString();
        simpleSelector.id = null; // pre-init property to avoid multiple hidden class
        simpleSelector.id = generate(simpleSelector);

        if (scope) {
            simpleSelector.compareMarker += `:${scope}`;
        }

        if (tagName !== '*') {
            simpleSelector.compareMarker += `,${tagName}`;
        }
    });

    // add property to all rule nodes to avoid multiple hidden class
    node.pseudoSignature = hasPseudo && Object.keys(pseudos).sort().join(',');
};
