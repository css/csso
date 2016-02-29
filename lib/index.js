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

    var filename = options.filename || '<unknown>';
    var result;

    // parse
    var ast = debugOutput('parsing', options, new Date(),
        parse(source, 'stylesheet', {
            filename: filename,
            positions: Boolean(options.sourceMap),
            needInfo: true
        })
    );

    // compress
    var compressedAst = debugOutput('compress', options, new Date(),
        compress(ast, compressOptions(options))
    );

    // translate
    if (options.sourceMap) {
        result = debugOutput('translateWithSourceMap', options, new Date(), (function() {
            var tmp = traslateInternalWithSourceMap(compressedAst);
            tmp.map._file = filename; // since other tools can relay on file in source map transform chain
            tmp.map.setSourceContent(filename, source);
            return tmp;
        })());
    } else {
        result = debugOutput('translate', options, new Date(),
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

    // internal ast
    internal: {
        fromGonzales: require('./compressor/ast/gonzalesToInternal'),
        toGonzales: require('./compressor/ast/internalToGonzales'),
        traslate: traslateInternal,
        traslateWithSourceMap: traslateInternalWithSourceMap,
        walk: internalWalkers.all,
        walkRules: internalWalkers.rules,
        walkRulesRight: internalWalkers.rulesRight
    },

    // deprecated
    justDoIt: justDoIt
};
