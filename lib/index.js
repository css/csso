var parse = require('css-tree').parse;
var compress = require('./compressor');
var translate = require('css-tree').translate;
var translateWithSourceMap = require('css-tree').translateWithSourceMap;
var walk = require('css-tree').walk;
var walkRules = require('css-tree').walkRules;
var walkRulesRight = require('css-tree').walkRulesRight;
var clone = require('css-tree').clone;
var List = require('css-tree').List;

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
            var css = translate(ast, true);

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

    if (typeof options.logger !== 'function' && options.debug) {
        options.logger = createDefaultLogger(options.debug);
    }

    return options;
}

function runPlugins(ast, options, plugin) {
    var plugins = [];
    if (Array.isArray(plugin)) {
        plugins = plugin;
    } else if (typeof plugin === 'function') {
        plugins = [plugin];
    }
    plugins.forEach(function(plugin) {
        plugin(ast, options);
    });
}

function minify(context, source, options) {
    options = options || {};

    var filename = options.filename || '<unknown>';
    var result;

    // parse
    var ast = debugOutput('parsing', options, Date.now(),
        parse(source, {
            context: context,
            filename: filename,
            positions: Boolean(options.sourceMap)
        })
    );

    // after parse plugins
    if (options.beforeCompress) {
        debugOutput('beforeCompress', options, Date.now(),
            runPlugins(ast, options, options.beforeCompress)
        );
    }

    // compress
    var compressResult = debugOutput('compress', options, Date.now(),
        compress(ast, buildCompressOptions(options))
    );

    // after compress plugins
    if (options.afterCompress) {
        debugOutput('afterCompress', options, Date.now(),
            runPlugins(compressResult, options, options.afterCompress)
        );
    }

    // translate
    if (options.sourceMap) {
        result = debugOutput('translateWithSourceMap', options, Date.now(), (function() {
            var tmp = translateWithSourceMap(compressResult.ast);
            tmp.map._file = filename; // since other tools can relay on file in source map transform chain
            tmp.map.setSourceContent(filename, source);
            return tmp;
        })());
    } else {
        result = debugOutput('translate', options, Date.now(), {
            css: translate(compressResult.ast),
            map: null
        });
    }

    return result;
}

function minifyStylesheet(source, options) {
    return minify('stylesheet', source, options);
};

function minifyBlock(source, options) {
    return minify('block', source, options);
}

module.exports = {
    version: require('../package.json').version,

    // classes
    List: List,

    // main methods
    minify: minifyStylesheet,
    minifyBlock: minifyBlock,

    // step by step
    parse: parse,
    compress: compress,
    translate: translate,
    translateWithSourceMap: translateWithSourceMap,

    // walkers
    walk: walk,
    walkRules: walkRules,
    walkRulesRight: walkRulesRight,

    // utils
    clone: clone
};
