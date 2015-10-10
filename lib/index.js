var parse = require('./parser');
var compress = require('./compressor');
var translate = require('./utils/translate');
var stringify = require('./utils/stringify')
var cleanInfo = require('./utils/cleanInfo');

var justDoIt = function(src, noStructureOptimizations, needInfo) {
    var ast = parse(src, 'stylesheet', needInfo);
    return translate(compress(ast, noStructureOptimizations), true);
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
    justDoIt: justDoIt
};
