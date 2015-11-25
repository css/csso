var constants = require('../const.js');
var notFPClasses = {
    'link': true,
    'visited': true,
    'hover': true,
    'active': true,
    'first-letter': true,
    'first-line': true
};

function containsPseudo(sselector) {
    return sselector.some(function(node) {
        switch (node.type) {
            case 'pseudoc':
            case 'pseudoe':
            case 'nthselector':
                if (node.name.value in notFPClasses === false) {
                    return true;
                }
        }
    });
};

function selectorSignature(selector) {
    // looks wrong and non-efficient
    return selector.map(function(node) {
        return node.info.s;
    }).sort().join(',');
}

function freezeNeeded(selector) {
    return selector.some(function(simpleSelector) {
        return simpleSelector.some(function(node) {
            switch (node.type) {
                case 'pseudoc':
                    if (node.name.value in notFPClasses === false) {
                        return true;
                    }
                    break;

                case 'pseudoe':
                    if (node.name.value in constants.notFPElements === false) {
                        return true;
                    }
                    break;

                case 'nthselector':
                    return true;
            }
        });
    });
}

function composePseudoID(selector) {
    var pseudos = [];

    selector.each(function(simpleSelector) {
        if (containsPseudo(simpleSelector)) {
            pseudos.push(simpleSelector.info.s);
        }
    });

    return pseudos.sort().join(',');
}

function pseudoSelectorSignature(selector, exclude) {
    var pseudos = {};
    var wasExclude = false;

    exclude = exclude || {};

    selector.each(function(simpleSelector) {
        simpleSelector.each(function(node) {
            switch (node.type) {
                case 'pseudoc':
                case 'pseudoe':
                case 'nthselector':
                    if (!exclude.hasOwnProperty(node.name.value)) {
                        pseudos[node.name.value] = 1;
                    } else {
                        wasExclude = true;
                    }
                    break;
            }
        });
    });

    return Object.keys(pseudos).sort().join(',') + wasExclude;
}

function markSimplePseudo(selector) {
    var hash = {};

    selector.each(function(simpleSelector) {
        var info = simpleSelector.info;

        info.pseudo = containsPseudo(simpleSelector);
        info.sg = hash;
        hash[info.s] = true;
    });
};

function freeze(node) {
    var info = node.info;
    var selector = node.selector;
    var freeze = freezeNeeded(selector);

    info.freeze = freeze;
    if (freeze) {
        info.freezeID = selectorSignature(selector);
        info.pseudoID = composePseudoID(selector);
        info.pseudoSignature = pseudoSelectorSignature(selector, constants.allowedPClasses);
        markSimplePseudo(selector);
    }
};

module.exports = {
    ruleset: freeze
};
