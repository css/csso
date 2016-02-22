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
    var genSourceMap = false;
    var minifyOptions = {
        outputAst: 'internal',
        sourceMap: false,
        inlineSourceMap: false
    };

    if (options) {
        for (var key in options) {
            minifyOptions[key] = options[key];
        }
    }

    if (minifyOptions.sourceMap || minifyOptions.inlineSourceMap) {
        genSourceMap = true;
    }

    // parse
    var ast = debugOutput('parsing', minifyOptions, new Date(),
        parse(source, 'stylesheet', {
            filename: minifyOptions.filename,
            needInfo: true,
            needPositions: genSourceMap
        })
    );

    // compress
    var minifiedAst = debugOutput('parsing', minifyOptions, new Date(),
        compress(ast, minifyOptions)
    );

    // translate
    var result = debugOutput('parsing', minifyOptions, new Date(),
        genSourceMap
            ? traslateInternalWithSourceMap(minifiedAst, minifyOptions.filename, source)
            : traslateInternal(minifiedAst)
    );

    // add inline source map if needed
    if (minifyOptions.inlineSourceMap) {
        result.css += '\n' +
            '/*# sourceMappingURL=data:application/json;base64,' +
            new Buffer(result.map.toString()).toString('base64') +
            ' */';
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
