const {
    property: resolveProperty,
    keyword: resolveKeyword,
    generate,
    walk
} = require('css-tree');

const { hasOwnProperty } = Object.prototype;

let fingerprintId = 1;
const dontRestructure = {
    src: 1 // https://github.com/afelix/csso/issues/50
};

const DONT_MIX_VALUE = {
    // https://developer.mozilla.org/en-US/docs/Web/CSS/display#Browser_compatibility
    'display': /table|ruby|flex|-(flex)?box$|grid|contents|run-in/i,
    // https://developer.mozilla.org/en/docs/Web/CSS/text-align
    'text-align': /^(start|end|match-parent|justify-all)$/i
};

const CURSOR_SAFE_VALUE = [
    'auto',
    'crosshair',
    'default',
    'move',
    'text',
    'wait',
    'help',
    'n-resize',
    'e-resize',
    's-resize',
    'w-resize',
    'ne-resize',
    'nw-resize',
    'se-resize',
    'sw-resize',
    'pointer',
    'progress',
    'not-allowed',
    'no-drop',
    'vertical-text',
    'all-scroll',
    'col-resize',
    'row-resize'
];

const POSITION_SAFE_VALUE = [
    'static', 'relative', 'absolute', 'fixed'
];

const NEEDLESS_TABLE = {
    'border-width': ['border'],
    'border-style': ['border'],
    'border-color': ['border'],
    'border-top': ['border'],
    'border-right': ['border'],
    'border-bottom': ['border'],
    'border-left': ['border'],
    'border-top-width': ['border-top', 'border-width', 'border'],
    'border-right-width': ['border-right', 'border-width', 'border'],
    'border-bottom-width': ['border-bottom', 'border-width', 'border'],
    'border-left-width': ['border-left', 'border-width', 'border'],
    'border-top-style': ['border-top', 'border-style', 'border'],
    'border-right-style': ['border-right', 'border-style', 'border'],
    'border-bottom-style': ['border-bottom', 'border-style', 'border'],
    'border-left-style': ['border-left', 'border-style', 'border'],
    'border-top-color': ['border-top', 'border-color', 'border'],
    'border-right-color': ['border-right', 'border-color', 'border'],
    'border-bottom-color': ['border-bottom', 'border-color', 'border'],
    'border-left-color': ['border-left', 'border-color', 'border'],
    'margin-top': ['margin'],
    'margin-right': ['margin'],
    'margin-bottom': ['margin'],
    'margin-left': ['margin'],
    'padding-top': ['padding'],
    'padding-right': ['padding'],
    'padding-bottom': ['padding'],
    'padding-left': ['padding'],
    'font-style': ['font'],
    'font-variant': ['font'],
    'font-weight': ['font'],
    'font-size': ['font'],
    'font-family': ['font'],
    'list-style-type': ['list-style'],
    'list-style-position': ['list-style'],
    'list-style-image': ['list-style']
};

function getPropertyFingerprint(propertyName, declaration, fingerprints) {
    const realName = resolveProperty(propertyName).basename;

    if (realName === 'background') {
        return `${propertyName}:${generate(declaration.value)}`;
    }

    const declarationId = declaration.id;
    let fingerprint = fingerprints[declarationId];

    if (!fingerprint) {
        switch (declaration.value.type) {
            case 'Value': {
                let vendorId = '';
                let iehack = '';
                const special = {};
                let raw = false;

                declaration.value.children.each(function walk(node) {
                    switch (node.type) {
                        case 'Value':
                        case 'Brackets':
                        case 'Parentheses':
                            node.children.each(walk);
                            break;

                        case 'Raw':
                            raw = true;
                            break;

                        case 'Identifier': {
                            const { name } = node;

                            if (!vendorId) {
                                vendorId = resolveKeyword(name).vendor;
                            }

                            if (/\\[09]/.test(name)) {
                                iehack = RegExp.lastMatch;
                            }

                            if (realName === 'cursor') {
                                if (CURSOR_SAFE_VALUE.indexOf(name) === -1) {
                                    special[name] = true;
                                }
                            } else if (realName === 'position') {
                                if (POSITION_SAFE_VALUE.indexOf(name) === -1) {
                                    special[name] = true;
                                }
                            } else if (hasOwnProperty.call(DONT_MIX_VALUE, realName)) {
                                if (DONT_MIX_VALUE[realName].test(name)) {
                                    special[name] = true;
                                }
                            }

                            break;
                        }

                        case 'Function': {
                            let { name } = node;

                            if (!vendorId) {
                                vendorId = resolveKeyword(name).vendor;
                            }

                            if (name === 'rect') {
                                // there are 2 forms of rect:
                                //   rect(<top>, <right>, <bottom>, <left>) - standart
                                //   rect(<top> <right> <bottom> <left>) – backwards compatible syntax
                                // only the same form values can be merged
                                const hasComma = node.children.some(node => {
                                    return node.type === 'Operator' && node.value === ',';
                                });
                                if (!hasComma) {
                                    name = 'rect-backward';
                                }
                            }

                            special[`${name}()`] = true;

                            // check nested tokens too
                            node.children.each(walk);

                            break;
                        }

                        case 'Dimension': {
                            const { unit } = node;

                            switch (unit) {
                                case 'rem': // is not supported until IE11
                                case 'vw': // v* units are too buggy across browsers so better don't merge values with those units
                                case 'vh':
                                case 'vmin':
                                case 'vmax':
                                case 'vm': // IE9 supporting "vm" instead of "vmin".
                                    special[unit] = true;
                                    break;
                            }

                            break;
                        }
                    }
                });

                fingerprint = raw ?
                    `!${fingerprintId++}` :
                    `!${Object.keys(special).sort()}|${iehack}${vendorId}`;
                break;
            }

            case 'Raw':
                fingerprint = `!${declaration.value.value}`;
                break;

            default:
                fingerprint = generate(declaration.value);
        }

        fingerprints[declarationId] = fingerprint;
    }

    return propertyName + fingerprint;
}

function needless(props, declaration, fingerprints) {
    const property = resolveProperty(declaration.property);

    if (hasOwnProperty.call(NEEDLESS_TABLE, property.basename)) {
        const table = NEEDLESS_TABLE[property.basename];

        for (let i = 0; i < table.length; i++) {
            const ppre = getPropertyFingerprint(property.prefix + table[i], declaration, fingerprints);
            const prev = hasOwnProperty.call(props, ppre) ? props[ppre] : null;

            if (prev && (!declaration.important || prev.item.data.important)) {
                return prev;
            }
        }
    }
}

function processRule(rule, item, list, props, fingerprints) {
    const declarations = rule.block.children;

    declarations.eachRight((declaration, declarationItem) => {
        const { property } = declaration;
        const fingerprint = getPropertyFingerprint(property, declaration, fingerprints);
        let prev = props[fingerprint];

        if (prev && !hasOwnProperty.call(dontRestructure, property)) {
            if (declaration.important && !prev.item.data.important) {
                props[fingerprint] = {
                    block: declarations,
                    item: declarationItem
                };

                prev.block.remove(prev.item);

                // TODO: use it when we can refer to several points in source
                // declaration.loc = {
                //     primary: declaration.loc,
                //     merged: prev.item.data.loc
                // };
            } else {
                declarations.remove(declarationItem);

                // TODO: use it when we can refer to several points in source
                // prev.item.data.loc = {
                //     primary: prev.item.data.loc,
                //     merged: declaration.loc
                // };
            }
        } else {
            prev = needless(props, declaration, fingerprints);

            if (prev) {
                declarations.remove(declarationItem);

                // TODO: use it when we can refer to several points in source
                // prev.item.data.loc = {
                //     primary: prev.item.data.loc,
                //     merged: declaration.loc
                // };
            } else {
                declaration.fingerprint = fingerprint;

                props[fingerprint] = {
                    block: declarations,
                    item: declarationItem
                };
            }
        }
    });

    if (declarations.isEmpty()) {
        list.remove(item);
    }
}

module.exports = function restructBlock(ast) {
    const stylesheetMap = {};
    const fingerprints = Object.create(null);

    walk(ast, {
        visit: 'Rule',
        reverse: true,
        enter(node, item, list) {
            const stylesheet = this.block || this.stylesheet;
            const ruleId = `${node.pseudoSignature || ''}|${node.prelude.children.first().id}`;
            let ruleMap;
            let props;

            if (hasOwnProperty.call(stylesheetMap, stylesheet.id)) {
                ruleMap = stylesheetMap[stylesheet.id];
            } else {
                ruleMap = {};
                stylesheetMap[stylesheet.id] = ruleMap;
            }

            if (hasOwnProperty.call(ruleMap, ruleId)) {
                props = ruleMap[ruleId];
            } else {
                props = {};
                ruleMap[ruleId] = props;
            }

            processRule.call(this, node, item, list, props, fingerprints);
        }
    });
};
