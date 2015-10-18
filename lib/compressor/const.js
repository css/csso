exports.nonLengthUnits = {
    'deg': 1,
    'grad': 1,
    'rad': 1,
    'turn': 1,
    's': 1,
    'ms': 1,
    'Hz': 1,
    'kHz': 1,
    'dpi': 1,
    'dpcm': 1,
    'dppx': 1
};

exports.cleanCfg = {
    'cleanComment': 1
};

exports.defCCfg = {
    'cleanCharset': 1,
    'cleanImport': 1,
    'cleanWhitespace': 1,
    'cleanDecldelim': 1,
    'compressNumber': 1,
    'cleanUnary': 1,
    'compressColor': 1,
    'compressDimension': 1,
    'compressString': 1,
    'compressFontWeight': 1,
    'compressFont': 1,
    'compressBackground': 1,
    'cleanEmpty': 1
};

exports.defRBCfg = {
    'restructureBlock': 1
};

exports.defRJCfg = {
    'rejoinRuleset': 1,
    'cleanEmpty': 1
};

exports.defRRCfg = {
    'restructureRuleset': 1,
    'cleanEmpty': 1
};

exports.defFCfg = {
    'cleanEmpty': 1,
    'delimSelectors': 1,
    'delimBlocks': 1
};

exports.preCfg = {
    'destroyDelims': 1,
    'preTranslate': 1
};

exports.msCfg = {
    'markShorthands': 1
};

exports.frCfg = {
    'freezeRulesets': 1
};

exports.csCfg = {
    'cleanShorthands': 1,
    'cleanEmpty': 1
};

exports.order = [
    'cleanCharset',
    'cleanImport',
    'cleanComment',
    'cleanWhitespace',
    'compressNumber',
    'cleanUnary',
    'compressColor',
    'compressDimension',
    'compressString',
    'compressFontWeight',
    'compressFont',
    'compressBackground',
    'freezeRulesets',
    'destroyDelims',
    'preTranslate',
    'markShorthands',
    'cleanShorthands',
    'restructureBlock',
    'rejoinRuleset',
    'restructureRuleset',
    'cleanEmpty',
    'delimSelectors',
    'delimBlocks'
];

exports.profile = {
    'cleanCharset': {
        'atrules': 1
    },
    'cleanImport': {
        'atrules': 1
    },
    'cleanWhitespace': {
        's': 1
    },
    'compressNumber': {
        'number': 1
    },
    'cleanUnary': {
        'unary': 1
    },
    'compressColor': {
        'vhash': 1,
        'funktion': 1,
        'ident': 1
    },
    'compressDimension': {
        'dimension': 1
    },
    'compressString': {
        'string': 1
    },
    'compressFontWeight': {
        'declaration': 1
    },
    'compressFont': {
        'declaration': 1
    },
    'compressBackground': {
        'declaration': 1
    },
    'cleanComment': {
        'comment': 1
    },
    'cleanDecldelim': {
        'block': 1
    },
    'cleanEmpty': {
        'ruleset': 1,
        'atruleb': 1,
        'atruler': 1
    },
    'destroyDelims': {
        'decldelim': 1,
        'delim': 1
    },
    'preTranslate': {
        'declaration': 1,
        'property': 1,
        'simpleselector': 1,
        'filter': 1,
        'value': 1,
        'number': 1,
        'percentage': 1,
        'dimension': 1,
        'ident': 1
    },
    'restructureBlock': {
        'block': 1
    },
    'rejoinRuleset': {
        'ruleset': 1
    },
    'restructureRuleset': {
        'ruleset': 1
    },
    'delimSelectors': {
        'selector': 1
    },
    'delimBlocks': {
        'block': 1
    },
    'markShorthands': {
        'block': 1
    },
    'cleanShorthands': {
        'declaration': 1
    },
    'freezeRulesets': {
        'ruleset': 1
    }
};

exports.notFPClasses = {
    'link': 1,
    'visited': 1,
    'hover': 1,
    'active': 1,
    'first-letter': 1,
    'first-line': 1
};

exports.notFPElements = {
    'first-letter': 1,
    'first-line': 1
};

exports.dontRestructure = {
    'src': 1 // https://github.com/afelix/csso/issues/50
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
