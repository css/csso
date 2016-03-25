var parse = require('./parser');
var compress = require('./compressor');
var traslateInternal = require('./compressor/ast/translate');
var traslateInternalWithSourceMap = require('./compressor/ast/translateWithSourceMap');
var internalWalkers = require('./compressor/ast/walk');
var walk = require('./utils/walker');
var translate = require('./utils/translate');
var stringify = require('./utils/stringify');
var cleanInfo = require('./utils/cleanInfo');

var justDoIt = function(src, noStructureOptimizations, needInfo) {
    console.warn('`csso.justDoIt()` method is deprecated, use `csso.minify()` instead');

    var ast = parse(src, 'stylesheet', needInfo);
    var compressed = compress(ast, {
        restructure: !noStructureOptimizations,
        outputAst: 'internal'
    });

    return traslateInternal(compressed);
};

function debugOutput(name, options, startTime, data) {
    if (options.debug) {
        console.error('## ' + name + ' done in %d ms\n', Date.now() - startTime);
    }

    return data;
}

function createDefaultLogger(level) {
    var lastDebug;

    return function logger(title, ast) {
        var line = title;

        if (ast) {
            line = '[' + ((Date.now() - lastDebug) / 1000).toFixed(3) + 's] ' + line;
        }

        if (level > 1 && ast) {
            var css = traslateInternal(ast, true);

            // when level 2, limit css to 256 symbols
            if (level === 2 && css.length > 256) {
                css = css.substr(0, 256) + '...';
            }

            line += '\n  ' + css + '\n';
        }

        console.error(line);
        lastDebug = Date.now();
    };
}

function copy(obj) {
    var result = {};

    for (var key in obj) {
        result[key] = obj[key];
    }

    return result;
}

function buildCompressOptions(options) {
    options = copy(options);
    options.outputAst = 'internal';

    if (typeof options.logger !== 'function' && options.debug) {
        options.logger = createDefaultLogger(options.debug);
    }

    return options;
}

function minify(context, source, options) {
    options = options || {};

    var filename = options.filename || '<unknown>';
    var result;

    // parse
    var ast = debugOutput('parsing', options, Date.now(),
        parse(source, context, {
            filename: filename,
            positions: Boolean(options.sourceMap),
            needInfo: true
        })
    );

    // compress
    var compressedAst = debugOutput('compress', options, Date.now(),
        compress(ast, buildCompressOptions(options))
    );

    // translate
    if (options.sourceMap) {
        result = debugOutput('translateWithSourceMap', options, Date.now(), (function() {
            var tmp = traslateInternalWithSourceMap(compressedAst);
            tmp.map._file = filename; // since other tools can relay on file in source map transform chain
            tmp.map.setSourceContent(filename, source);
            return tmp;
        })());
    } else {
        result = debugOutput('translate', options, Date.now(),
            traslateInternal(compressedAst)
        );
    }

    return result;
}

function minifyStylesheet(source, options) {
    return minify('stylesheet', source, options);
};

function minifyBlock(source, options) {
    return minify('declarations', source, options);
}

module.exports = {
    version: require('../package.json').version,

    // main method
    minify: minifyStylesheet,
    minifyBlock: minifyBlock,

    // utils
    parse: parse,
    compress: compress,
    translate: translate,

    walk: walk,
    stringify: stringify,
    cleanInfo: cleanInfo,

    // internal ast
    internal: {
        fromGonzales: require('./compressor/ast/gonzalesToInternal'),
        toGonzales: require('./compressor/ast/internalToGonzales'),
        translate: traslateInternal,
        translateWithSourceMap: traslateInternalWithSourceMap,
        walk: internalWalkers.all,
        walkRules: internalWalkers.rules,
        walkRulesRight: internalWalkers.rulesRight
    },

    // deprecated
    justDoIt: justDoIt
};
