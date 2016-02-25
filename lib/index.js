var parse = require('./parser');
var compress = require('./compressor');
var traslateInternal = require('./compressor/ast/translate');
var traslateInternalWithSourceMap = require('./compressor/ast/translateWithSourceMap');
var walk = require('./utils/walker');
var translate = require('./utils/translate');
var stringify = require('./utils/stringify');
var cleanInfo = require('./utils/cleanInfo');

function debugOutput(name, options, startTime, data) {
    if (options.debug) {
        console.error('## ' + name + ' done in %d ms\n', Date.now() - startTime);
    }

    return data;
}

var justDoIt = function(src, noStructureOptimizations, needInfo) {
    console.warn('`csso.justDoIt()` method is deprecated, use `csso.minify()` instead');

    var ast = parse(src, 'stylesheet', needInfo);
    var compressed = compress(ast, {
        restructure: !noStructureOptimizations,
        outputAst: 'internal'
    });

    return traslateInternal(compressed);
};

var minify = function(source, options) {
    // process options
    var minifyOptions = {
        outputAst: 'internal',
        sourceMap: false,
        filename: '<unknown>'
    };

    if (options) {
        for (var key in options) {
            minifyOptions[key] = options[key];
        }
    }

    // parse
    var ast = debugOutput('parsing', minifyOptions, new Date(),
        parse(source, 'stylesheet', {
            needPositions: minifyOptions.sourceMap,
            needInfo: true
        })
    );

    // compress
    var minifiedAst = debugOutput('compress', minifyOptions, new Date(),
        compress(ast, minifyOptions)
    );

    // translate
    if (minifyOptions.sourceMap) {
        var result = debugOutput('translateWithSourceMap', minifyOptions, new Date(),
            traslateInternalWithSourceMap(minifiedAst, {
                inputSourceMap: minifyOptions.inputSourceMap,
                filename: minifyOptions.filename,
                source: source
            })
        );
    } else {
        var result = debugOutput('translate', minifyOptions, new Date(),
            traslateInternal(minifiedAst)
        );
    }

    return result;
};

module.exports = {
    version: require('../package.json').version,

    // main method
    minify: minify,

    // utils
    parse: parse,
    compress: compress,
    translate: translate,

    walk: walk,
    stringify: stringify,
    cleanInfo: cleanInfo,

    // deprecated
    justDoIt: justDoIt
};
