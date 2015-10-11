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
    'src': 1, // https://github.com/afelix/csso/issues/50
    'clip': 1, // https://github.com/afelix/csso/issues/57
    'display': 1 // https://github.com/afelix/csso/issues/71
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

// http://www.w3.org/TR/css3-color/#svg-color
exports.colorNameToHex = {
    'aliceblue': 'f0f8ff',
    'antiquewhite': 'faebd7',
    'aqua': '0ff',
    'aquamarine': '7fffd4',
    'azure': 'f0ffff',
    'beige': 'f5f5dc',
    'bisque': 'ffe4c4',
    'black': '000',
    'blanchedalmond': 'ffebcd',
    'blue': '00f',
    'blueviolet': '8a2be2',
    'brown': 'a52a2a',
    'burlywood': 'deb887',
    'cadetblue': '5f9ea0',
    'chartreuse': '7fff00',
    'chocolate': 'd2691e',
    'coral': 'ff7f50',
    'cornflowerblue': '6495ed',
    'cornsilk': 'fff8dc',
    'crimson': 'dc143c',
    'cyan': '0ff',
    'darkblue': '00008b',
    'darkcyan': '008b8b',
    'darkgoldenrod': 'b8860b',
    'darkgray': 'a9a9a9',
    'darkgrey': 'a9a9a9',
    'darkgreen': '006400',
    'darkkhaki': 'bdb76b',
    'darkmagenta': '8b008b',
    'darkolivegreen': '556b2f',
    'darkorange': 'ff8c00',
    'darkorchid': '9932cc',
    'darkred': '8b0000',
    'darksalmon': 'e9967a',
    'darkseagreen': '8fbc8f',
    'darkslateblue': '483d8b',
    'darkslategray': '2f4f4f',
    'darkslategrey': '2f4f4f',
    'darkturquoise': '00ced1',
    'darkviolet': '9400d3',
    'deeppink': 'ff1493',
    'deepskyblue': '00bfff',
    'dimgray': '696969',
    'dimgrey': '696969',
    'dodgerblue': '1e90ff',
    'firebrick': 'b22222',
    'floralwhite': 'fffaf0',
    'forestgreen': '228b22',
    'fuchsia': 'f0f',
    'gainsboro': 'dcdcdc',
    'ghostwhite': 'f8f8ff',
    'gold': 'ffd700',
    'goldenrod': 'daa520',
    'gray': '808080',
    'grey': '808080',
    'green': '008000',
    'greenyellow': 'adff2f',
    'honeydew': 'f0fff0',
    'hotpink': 'ff69b4',
    'indianred': 'cd5c5c',
    'indigo': '4b0082',
    'ivory': 'fffff0',
    'khaki': 'f0e68c',
    'lavender': 'e6e6fa',
    'lavenderblush': 'fff0f5',
    'lawngreen': '7cfc00',
    'lemonchiffon': 'fffacd',
    'lightblue': 'add8e6',
    'lightcoral': 'f08080',
    'lightcyan': 'e0ffff',
    'lightgoldenrodyellow': 'fafad2',
    'lightgray': 'd3d3d3',
    'lightgrey': 'd3d3d3',
    'lightgreen': '90ee90',
    'lightpink': 'ffb6c1',
    'lightsalmon': 'ffa07a',
    'lightseagreen': '20b2aa',
    'lightskyblue': '87cefa',
    'lightslategray': '789',
    'lightslategrey': '789',
    'lightsteelblue': 'b0c4de',
    'lightyellow': 'ffffe0',
    'lime': '0f0',
    'limegreen': '32cd32',
    'linen': 'faf0e6',
    'magenta': 'f0f',
    'maroon': '800000',
    'mediumaquamarine': '66cdaa',
    'mediumblue': '0000cd',
    'mediumorchid': 'ba55d3',
    'mediumpurple': '9370db',
    'mediumseagreen': '3cb371',
    'mediumslateblue': '7b68ee',
    'mediumspringgreen': '00fa9a',
    'mediumturquoise': '48d1cc',
    'mediumvioletred': 'c71585',
    'midnightblue': '191970',
    'mintcream': 'f5fffa',
    'mistyrose': 'ffe4e1',
    'moccasin': 'ffe4b5',
    'navajowhite': 'ffdead',
    'navy': '000080',
    'oldlace': 'fdf5e6',
    'olive': '808000',
    'olivedrab': '6b8e23',
    'orange': 'ffa500',
    'orangered': 'ff4500',
    'orchid': 'da70d6',
    'palegoldenrod': 'eee8aa',
    'palegreen': '98fb98',
    'paleturquoise': 'afeeee',
    'palevioletred': 'db7093',
    'papayawhip': 'ffefd5',
    'peachpuff': 'ffdab9',
    'peru': 'cd853f',
    'pink': 'ffc0cb',
    'plum': 'dda0dd',
    'powderblue': 'b0e0e6',
    'purple': '800080',
    'rebeccapurple': '639',
    'red': 'f00',
    'rosybrown': 'bc8f8f',
    'royalblue': '4169e1',
    'saddlebrown': '8b4513',
    'salmon': 'fa8072',
    'sandybrown': 'f4a460',
    'seagreen': '2e8b57',
    'seashell': 'fff5ee',
    'sienna': 'a0522d',
    'silver': 'c0c0c0',
    'skyblue': '87ceeb',
    'slateblue': '6a5acd',
    'slategray': '708090',
    'slategrey': '708090',
    'snow': 'fffafa',
    'springgreen': '00ff7f',
    'steelblue': '4682b4',
    'tan': 'd2b48c',
    'teal': '008080',
    'thistle': 'd8bfd8',
    'tomato': 'ff6347',
    'turquoise': '40e0d0',
    'violet': 'ee82ee',
    'wheat': 'f5deb3',
    'white': 'fff',
    'whitesmoke': 'f5f5f5',
    'yellow': 'ff0',
    'yellowgreen': '9acd32'
};

exports.colorHexToName = {
    "800000": "maroon",
    "800080": "purple",
    "808000": "olive",
    "808080": "gray",
    "00ffff": "cyan",
    "f0ffff": "azure",
    "f5f5dc": "beige",
    "ffe4c4": "bisque",
    "000000": "black",
    "0000ff": "blue",
    "a52a2a": "brown",
    "ff7f50": "coral",
    "ffd700": "gold",
    "008000": "green",
    "4b0082": "indigo",
    "fffff0": "ivory",
    "f0e68c": "khaki",
    "00ff00": "lime",
    "faf0e6": "linen",
    "000080": "navy",
    "ffa500": "orange",
    "da70d6": "orchid",
    "cd853f": "peru",
    "ffc0cb": "pink",
    "dda0dd": "plum",
    "f00": "red",
    "ff0000": "red",
    "fa8072": "salmon",
    "a0522d": "sienna",
    "c0c0c0": "silver",
    "fffafa": "snow",
    "d2b48c": "tan",
    "008080": "teal",
    "ff6347": "tomato",
    "ee82ee": "violet",
    "f5deb3": "wheat",
    "ffffff": "white",
    "ffff00": "yellow"
};
