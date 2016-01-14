var parse = require('./parser');
var compress = require('./compressor');
var traslateInternal = require('./compressor/ast/translate');
var walk = require('./utils/walker');
var translate = require('./utils/translate');
var stringify = require('./utils/stringify');
var cleanInfo = require('./utils/cleanInfo');

var justDoIt = function(src, noStructureOptimizations, needInfo) {
    console.warn('`csso.justDoIt()` method is deprecated, use `csso.minify()` instead');

    var ast = parse(src, 'stylesheet', needInfo);
    var compressed = compress(ast, {
        restructuring: !noStructureOptimizations,
        outputAst: 'internal'
    });

    return traslateInternal(compressed);
};

var minify = function(src, options) {
    var minifyOptions = {
        outputAst: 'internal'
    };

    if (options) {
        for (var key in options) {
            minifyOptions[key] = options[key];
        }
    }

    var t = Date.now();
    var ast = parse(src, 'stylesheet', true);
    if (minifyOptions.debug) {
        console.error('## parsing done in %d ms\n', Date.now() - t);
    }

    var t = Date.now();
    var compressed = compress(ast, minifyOptions);
    if (minifyOptions.debug) {
        console.error('## compressing done in %d ms\n', Date.now() - t);
    }

    return traslateInternal(compressed);
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
