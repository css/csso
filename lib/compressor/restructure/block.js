var utils = require('../utils.js');
var nameVendorMap = {};
var propertyInfoMap = {};
var dontRestructure = {
    'src': 1 // https://github.com/afelix/csso/issues/50
};

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

function getVendorIDFromToken(token) {
    var name;

    switch (token[1]) {
        case 'ident':
            name = getVendorFromString(token[2]);
            break;

        case 'funktion':
            name = getVendorFromString(token[2][2]);
            break;
    }

    return name || '';
}

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
    if (name in propertyInfoMap) {
        return propertyInfoMap[name];
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

    return propertyInfoMap[name] = {
        prefix: hack + vendor,
        hack: hack,
        vendor: vendor,
        table: NEEDLESS_TABLE[name.substr(vendor.length)]
    };
}

function getPropertyFingerprint(property, value, declaration, freeze) {
    var fp = freeze ? 'freeze:' : '';

    if (property.indexOf('background') !== -1) {
        return fp + declaration[0].s;
    }

    var vendorId = '';
    var hack9 = 0;
    var functions = {};
    var units = {};

    for (var i = 2; i < value.length; i++) {
        if (!vendorId) {
            vendorId = getVendorIDFromToken(value[i]);
        }

        switch (value[i][1]) {
            case 'ident':
                if (value[i][2] === '\\9') {
                    hack9 = 1;
                }
                break;

            case 'funktion':
                var name = value[i][2][2];

                if (name === 'rect') {
                    // there are 2 forms of rect:
                    //   rect(<top>, <right>, <bottom>, <left>) - standart
                    //   rect(<top> <right> <bottom> <left>) – backwards compatible syntax
                    // only the same form values can be merged
                    if (value[i][3].slice(2).some(function(token) {
                        return token[1] === 'operator' && token[2] === ',';
                    })) {
                        name = 'rect-backward';
                    }
                }

                functions[name] = true;
                break;

            case 'dimension':
                var unit = value[i][3][2];
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
                        units[unit] = true;
                        break;
                }
                break;
        }
    }

    return (
        fp + property +
        '[' + Object.keys(functions) + ']' +
        Object.keys(units) +
        hack9 + vendorId
    );
}

function needless(name, props, important, v, d, freeze) {
    var info = getPropertyInfo(name);
    var table = info.table;

    if (table) {
        for (var i = 0; i < table.length; i++) {
            var ppre = getPropertyFingerprint(info.prefix + table[i], v, d, freeze);
            var property = props[ppre];

            if (property) {
                return !important || property.important;
            }
        }
    }
}

module.exports = function restructureBlock(ruleset, parent) {
    var rulesetInfo = ruleset[0];
    var selectorInfo = ruleset[2][2][0];
    var token = ruleset[3];

    var freeze = rulesetInfo.freeze;
    var freezeID = rulesetInfo.freezeID;
    var pseudoID = rulesetInfo.pseudoID;
    var isPseudo = selectorInfo.pseudo;
    var sg = selectorInfo.sg;
    var props = parent[0].selectorsMap[selectorInfo.s].props;

    for (var i = token.length - 1; i > -1; i--) {
        var child = token[i];

        if (child[1] === 'declaration') {
            var value = child[3];
            var important = value[value.length - 1][1] === 'important';
            var property = child[2][0].s;
            var fingerprint = getPropertyFingerprint(property, value, child, freeze);
            var ppreProps = props[fingerprint];

            if (!dontRestructure[property] && ppreProps) {
                if ((isPseudo && freezeID === ppreProps.freezeID) || // pseudo from equal selectors group
                    (!isPseudo && pseudoID === ppreProps.pseudoID) || // not pseudo from equal pseudo signature group
                    (isPseudo && pseudoID === ppreProps.pseudoID && utils.hashInHash(sg, ppreProps.sg))) { // pseudo from covered selectors group
                    if (important && !ppreProps.important) {
                        props[fingerprint] = {
                            block: token,
                            child: child,
                            important: important,
                            sg: sg,
                            freezeID: freezeID,
                            pseudoID: pseudoID
                        };

                        ppreProps.block.splice(ppreProps.block.indexOf(ppreProps.child), 1);
                    } else {
                        token.splice(i, 1);
                    }
                }
            } else if (needless(property, props, important, value, child, freeze)) {
                token.splice(i, 1);
            } else {
                child[0].fingerprint = fingerprint;

                props[fingerprint] = {
                    block: token,
                    child: child,
                    important: important,
                    sg: sg,
                    freezeID: freezeID,
                    pseudoID: pseudoID
                };
            }
        }
    }
};
