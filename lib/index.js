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
        restructuring: !noStructureOptimizations
    });
    return traslateInternal(compressed);
};

var minify = function(src, options) {
    var t = new Date;
    var ast = parse(src, 'stylesheet', true);
    if (options && options.debug) {
        console.log('## parse', new Date - t);
    }

    var t = new Date;
    var compressed = compress(ast, options);
    if (options && options.debug) {
        console.log('## compress', new Date - t);
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
