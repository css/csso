var allowedPseudoClasses = new Set([
    'after',
    'before'
]);
var nonFreezePreudoElements = new Set([
    'first-letter',
    'first-line'
]);
var nonFreezePseudoClasses = new Set([
    'link',
    'visited',
    'hover',
    'active',
    'first-letter',
    'first-line'
]);

function containsPseudo(simpleSelector) {
    return simpleSelector.sequence.some(function(node) {
        switch (node.type) {
            case 'PseudoClass':
                if (!nonFreezePseudoClasses.has(node.name)) {
                    return true;
                }

            case 'PseudoElement':
            case 'FunctionalPseudo':
                return true;
        }
    });
}

function freezeNeeded(selector) {
    return selector.selectors.some(function(simpleSelector) {
        return simpleSelector.sequence.some(function(node) {
            switch (node.type) {
                case 'PseudoClass':
                    return !nonFreezePseudoClasses.has(node.name);

                case 'PseudoElement':
                    return !nonFreezePreudoElements.has(node.name);

                case 'FunctionalPseudo':
                    return true;
            }
        });
    });
}

function composePseudoID(selector) {
    var pseudos = [];

    selector.selectors.each(function(simpleSelector) {
        if (simpleSelector.info.pseudo) {
            pseudos.push(simpleSelector.info.s);
        }
    });

    return pseudos.sort().join(',');
}

function pseudoSelectorSignature(selector) {
    var pseudos = {};
    var wasExclude = false;

    selector.selectors.each(function(simpleSelector) {
        simpleSelector.sequence.each(function(node) {
            switch (node.type) {
                case 'PseudoClass':
                case 'PseudoElement':
                case 'FunctionalPseudo':
                    if (node.name !== 'before' && node.name !== 'after') {
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

    selector.selectors.each(function(simpleSelector) {
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

        markSimplePseudo(selector);
        info.freeze = freeze;
        info.pseudoID = composePseudoID(selector);
        info.pseudoSignature = pseudoSelectorSignature(selector);
    }
};
