var translate = require('../ast/translate.js');
var utils = require('./utils.js');
var nameVendorMap = Object.create(null);
var propertyInfoMap = Object.create(null);
var dontRestructure = {
    'src': 1 // https://github.com/afelix/csso/issues/50
};

// https://developer.mozilla.org/en-US/docs/Web/CSS/display#Browser_compatibility
var DISPLAY_DONT_MIX_VALUE = /table|ruby|flex|-(flex)?box$|grid|contents|run-in/;

var NEEDLESS_TABLE = {
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

function getVendorFromString(string) {
    if (string[0] === '-') {
        if (string in nameVendorMap) {
            return nameVendorMap[string];
        }

        var secondDashIndex = string.indexOf('-', 2);
        if (secondDashIndex !== -1) {
            return nameVendorMap[string] = string.substr(0, secondDashIndex + 1);
        }
    }

    return '';
}

function getPropertyInfo(name) {
    name = name.toLowerCase();

    var info = propertyInfoMap[name];

    if (info) {
        return info;
    }

    var hack = name[0];

    if (hack === '*' || hack === '_' || hack === '$') {
        name = name.substr(1);
    } else if (hack === '/' && name[1] === '/') {
        hack = '//';
        name = name.substr(2);
    } else {
        hack = '';
    }

    var vendor = getVendorFromString(name);
    name = name.substr(vendor.length);

    return propertyInfoMap[name] = {
        name: name,
        prefix: hack + vendor,
        hack: hack,
        vendor: vendor,
        table: NEEDLESS_TABLE[name]
    };
}

function getPropertyFingerprint(propertyName, declaration, fingerprints) {
    var realName = getPropertyInfo(propertyName).name;

    if (realName === 'background' ||
       (realName === 'filter' && declaration.value.sequence.first().type === 'Progid')) {
        return propertyName + ':' + translate(declaration.value);
    }

    var declarationId = declaration.info.s;
    var fingerprint = fingerprints[declarationId];

    if (!fingerprint) {
        var vendorId = '';
        var hack9 = '';
        var functions = {};
        var special = {};

        declaration.value.sequence.each(function(node) {
            switch (node.type) {
                case 'Identifier':
                    var name = node.name;

                    if (!vendorId) {
                        vendorId = getVendorFromString(name);
                    }

                    if (name === '\\9') {
                        hack9 = name;
                    }

                    if (realName === 'display' && DISPLAY_DONT_MIX_VALUE.test(name)) {
                        special[name] = true;
                    }

                    break;

                case 'Function':
                    var name = node.name;

                    if (!vendorId) {
                        vendorId = getVendorFromString(name);
                    }

                    if (name === 'rect') {
                        // there are 2 forms of rect:
                        //   rect(<top>, <right>, <bottom>, <left>) - standart
                        //   rect(<top> <right> <bottom> <left>) – backwards compatible syntax
                        // only the same form values can be merged
                        if (node.arguments.size < 4) {
                            name = 'rect-backward';
                        }
                    }

                    functions[name] = true;
                    break;

                case 'Dimension':
                    var unit = node.unit;

                    switch (unit) {
                        // is not supported until IE11
                        case 'rem':

                        // v* units is too buggy across browsers and better
                        // don't merge values with those units
                        case 'vw':
                        case 'vh':
                        case 'vmin':
                        case 'vmax':
                        case 'vm': // IE9 supporting "vm" instead of "vmin".
                            special[unit] = true;
                            break;
                    }
                    break;
            }
        });

        fingerprint =
            '|' + Object.keys(functions).sort() + '|' +
            Object.keys(special).sort() + '|' +
            hack9 + vendorId;

        fingerprints[declarationId] = fingerprint;
    }

    return propertyName + fingerprint;
}

function needless(props, declaration, fingerprints) {
    var info = getPropertyInfo(declaration.property.name);
    var table = info.table;

    if (table) {
        for (var i = 0; i < table.length; i++) {
            var ppre = getPropertyFingerprint(info.prefix + table[i], declaration, fingerprints);
            var prev = props[ppre];

            if (prev) {
                return !declaration.value.important || prev.item.data.value.important;
            }
        }
    }
}

module.exports = function restructBlock(ruleset, parent, list, item) {
    var fingerprints = parent.info.fingerprints;
    var props = ruleset.info.props;
    var declarations = ruleset.block.declarations;

    declarations.eachRight(function(declaration, declarationItem) {
        var property = declaration.property.name;
        var fingerprint = getPropertyFingerprint(property, declaration, fingerprints);
        var prev = props[fingerprint];

        if (prev && !dontRestructure.hasOwnProperty(property)) {
            if (declaration.value.important && !prev.item.data.value.important) {
                props[fingerprint] = {
                    block: declarations,
                    item: declarationItem
                };

                prev.block.remove(prev.item);
            } else {
                declarations.remove(declarationItem);
            }
        } else if (needless(props, declaration, fingerprints)) {
            declarations.remove(declarationItem);
        } else {
            declaration.info.fingerprint = fingerprint;

            props[fingerprint] = {
                block: declarations,
                item: declarationItem
            };
        }
    });

    if (declarations.isEmpty()) {
        list.remove(item);
    }
};
