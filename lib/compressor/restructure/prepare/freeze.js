var allowedPseudoClasses = {
    'after': 1,
    'before': 1
};
var nonFreezePreudoElements = {
    'first-letter': true,
    'first-line': true
};
var nonFreezePseudoClasses = {
    'link': true,
    'visited': true,
    'hover': true,
    'active': true,
    'first-letter': true,
    'first-line': true
};

function containsPseudo(simpleSelector) {
    return simpleSelector.sequence.some(function(node) {
        switch (node.type) {
            case 'PseudoClass':
            case 'PseudoElement':
            case 'FunctionalPseudo':
                if (node.name in nonFreezePseudoClasses === false) {
                    return true;
                }
        }
    });
}

function selectorSignature(selector) {
    // looks wrong and non-efficient
    return selector.selectors.map(function(node) {
        return node.info.s;
    }).sort().join(',');
}

function freezeNeeded(selector) {
    return selector.selectors.some(function(simpleSelector) {
        return simpleSelector.sequence.some(function(node) {
            switch (node.type) {
                case 'PseudoClass':
                    if (node.name in nonFreezePseudoClasses === false) {
                        return true;
                    }
                    break;

                case 'PseudoElement':
                    if (node.name in nonFreezePreudoElements === false) {
                        return true;
                    }
                    break;

                case 'FunctionalPseudo':
                    return true;
            }
        });
    });
}

function composePseudoID(selector) {
    var pseudos = [];

    selector.selectors.forEach(function(simpleSelector) {
        if (containsPseudo(simpleSelector)) {
            pseudos.push(simpleSelector.info.s);
        }
    });

    return pseudos.sort().join(',');
}

function pseudoSelectorSignature(selector, exclude) {
    var pseudos = {};
    var wasExclude = false;

    selector.selectors.forEach(function(simpleSelector) {
        simpleSelector.sequence.forEach(function(node) {
            switch (node.type) {
                case 'PseudoClass':
                case 'PseudoElement':
                case 'FunctionalPseudo':
                    if (!exclude.hasOwnProperty(node.name)) {
                        pseudos[node.name] = 1;
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

    selector.selectors.forEach(function(simpleSelector) {
        var info = simpleSelector.info;

        info.pseudo = containsPseudo(simpleSelector);
        info.sg = hash;
        hash[info.s] = true;
    });
}

module.exports = function freeze(node) {
    var selector = node.selector;
    var freeze = freezeNeeded(selector);

    if (freeze) {
        var info = node.info;

        info.freeze = freeze;
        info.freezeID = selectorSignature(selector);
        info.pseudoID = composePseudoID(selector);
        info.pseudoSignature = pseudoSelectorSignature(selector, allowedPseudoClasses);
        markSimplePseudo(selector);
    }
};
