var parse = require('./parser');
var compress = require('./compressor');
var traslateInternal = require('./compressor/ast/translate');
var traslateInternalWithSourceMap = require('./compressor/ast/translateWithSourceMap');
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

function compressOptions(options) {
    var result = {};

    for (var key in options) {
        result[key] = options[key];
    }

    result.outputAst = 'internal';

    return result;
}

var minify = function(source, options) {
    options = options || {};

    // parse
    var ast = debugOutput('parsing', options, new Date(),
        parse(source, 'stylesheet', {
            filename: options.filename || '<unknown>',
            positions: Boolean(options.sourceMap)
        })
    );

    // compress
    var compressedAst = debugOutput('compress', options, new Date(),
        compress(ast, compressOptions(options))
    );

    // translate
    if (options.sourceMap) {
        var result = debugOutput('translateWithSourceMap', options, new Date(),
            traslateInternalWithSourceMap(compressedAst)
        );
    } else {
        var result = debugOutput('translate', options, new Date(),
            traslateInternal(compressedAst)
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
