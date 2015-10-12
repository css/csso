var parse = require('./parser');
var compress = require('./compressor');
var translate = require('./utils/translate');
var stringify = require('./utils/stringify');
var cleanInfo = require('./utils/cleanInfo');

var justDoIt = function(src, noStructureOptimizations, needInfo) {
    console.warn('`csso.justDoIt()` method is deprecated, use `csso.minify()` instead');

    var ast = parse(src, 'stylesheet', needInfo);
    var compressed = compress(ast, {
        restructuring: !noStructureOptimizations
    });
    return translate(compressed, true);
};

var minify = function(src, options) {
    var ast = parse(src, 'stylesheet', true);
    var compressed = compress(ast, options);
    return translate(compressed, true);
};

module.exports = {
    parse: function(s, rule, needInfo) {
        return parse(s, rule, needInfo);
    },
    cleanInfo: cleanInfo,
    treeToString: stringify,
    printTree: function(ast) {
        console.log(stringify(ast));
    },
    translate: translate,
    compress: compress,
    justDoIt: justDoIt,
    minify: minify
};
