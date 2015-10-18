exports.defRBCfg = {
    'restructureBlock': 1
};

exports.defRJCfg = {
    'rejoinRuleset': 1
    // 'cleanEmpty': 1
};

exports.defRRCfg = {
    'restructureRuleset': 1
    // 'cleanEmpty': 1
};

exports.msCfg = {
    'markShorthands': 1
};

exports.csCfg = {
    'cleanShorthands': 1
    // 'cleanEmpty': 1
};

exports.order = [
    // 'cleanCharset',
    // 'cleanImport',
    // 'cleanComment',
    // 'cleanWhitespace',
    // 'compressNumber',
    // 'cleanUnary',
    // 'compressColor',
    // 'compressDimension',
    // 'compressString',
    // 'compressFontWeight',
    // 'compressFont',
    // 'compressBackground',
    // 'freezeRulesets',
    // 'destroyDelims',
    // 'preTranslate',
    'markShorthands',
    'cleanShorthands',
    'restructureBlock',
    'rejoinRuleset',
    'restructureRuleset'
    // 'cleanEmpty',
    // 'delimSelectors',
    // 'delimBlocks'
];

exports.profile = {
    'restructureBlock': {
        'block': 1
    },
    'rejoinRuleset': {
        'ruleset': 1
    },
    'restructureRuleset': {
        'ruleset': 1
    },
    'markShorthands': {
        'block': 1
    },
    'cleanShorthands': {
        'declaration': 1
    }
};

exports.notFPElements = {
    'first-letter': 1,
    'first-line': 1
};

exports.dontRestructure = {
    'src': 1, // https://github.com/css/csso/issues/50
    'clip': 1, // https://github.com/css/csso/issues/57
    'display': 1 // https://github.com/css/csso/issues/71
};

exports.vendorID = {
    '-o-': 'o',
    '-moz-': 'm',
    '-webkit-': 'w',
    '-ms-': 'i',
    '-epub-': 'e',
    '-apple-': 'a',
    '-xv-': 'x',
    '-wap-': 'p'
};

exports.nlTable = {
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

exports.allowedPClasses = {
    'after': 1,
    'before': 1
};
