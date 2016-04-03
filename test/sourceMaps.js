var fs = require('fs');
var assert = require('assert');
var csso = require('../lib/index.js');
var SourceMapConsumer = require('source-map').SourceMapConsumer;
var translateWithSourceMap = require('../lib/utils/translateWithSourceMap.js');
var forEachTest = require('./fixture/parse').forEachTest;
var css = '.a { color: #ff0000; }\n.b { display: block; float: left; }';
var minifiedCss = '.a{color:red}.b{display:block;float:left}';
var anonymousMap = defineSourceMap('<unknown>');
var filenameMap = defineSourceMap('test.css');
var points = ['.a', 'color', '.b', 'display', 'float'];

function getOriginalPosition(str, source, filename) {
    var index = source.indexOf(str);
    var line = null;
    var column = null;

    if (index !== -1) {
        var lines = source.substr(0, index).split('\n');
        line = lines.length;
        column = lines.pop().length;
    }

    return {
        source: filename || '<unknown>',
        line: line,
        column: column,
        name: null
    };
}

function getGeneratedPosition(str, source) {
    var index = source.indexOf(str);
    var line = null;
    var column = null;

    if (index !== -1) {
        var lines = source.substr(0, index).split('\n');
        line = lines.length;
        column = lines.pop().length;
    }

    return {
        line: line,
        column: column,
        lastColumn: null
    };
}

function defineSourceMap(filename) {
    var string = '{"version":3,"sources":["' + filename + '"],"names":[],"mappings":"AAAA,E,CAAK,S,CACL,E,CAAK,a,CAAgB,U","file":"' + filename + '","sourcesContent":[' + JSON.stringify(css) + ']}';
    var base64 = new Buffer(string, 'utf8').toString('base64');
    var inline = '/*# sourceMappingURL=data:application/json;base64,' + base64 + ' */';

    return {
        string: string,
        base64: base64,
        inline: inline
    };
}

function extractSourceMap(source) {
    var m = source.match(/\/\*# sourceMappingURL=data:application\/json;base64,(.+) \*\//);

    if (m) {
        return new Buffer(m[1], 'base64').toString();
    }
}

function createTranslateWidthSourceMapTest(name, test, scope) {
    it(name, function() {
        var ast = csso.parse(test.source, scope, true);

        // strings should be equal
        assert.equal(translateWithSourceMap(ast).css, 'translate' in test ? test.translate : test.source);
    });
}

describe('sourceMaps', function() {
    describe('translateWithSourceMap', function() {
        forEachTest(createTranslateWidthSourceMapTest);
    });

    it('should return object when sourceMap is true', function() {
        var result = csso.minify(css, {
            sourceMap: true
        });

        assert(typeof result === 'object');
        assert('css' in result, 'should has `css` property');
        assert('map' in result, 'should has `map` property');
        assert.equal(result.css, minifiedCss);
        assert.equal(result.map.toString(), anonymousMap.string);
    });

    it('should use passed filename in map', function() {
        var result = csso.minify(css, {
            sourceMap: true,
            filename: 'test.css'
        });

        assert.equal(result.css, minifiedCss);
        assert.equal(result.map.toString(), filenameMap.string);
    });

    it('should store both position on block merge', function() {
        var css =
            '/*! check location merge */.a {a:1;a:2} .a {b:2}' +
            '/*! several exlamation comments */.foo { color: red }';
        var result = csso.minify(css, {
            sourceMap: true
        });

        assert.equal(result.css,
            '/*! check location merge */\n.a{a:2;b:2}\n' +
            '/*! several exlamation comments */\n.foo{color:red}');
        assert.equal(result.map.toString(), '{"version":3,"sources":["<unknown>"],"names":[],"mappings":";AAA2B,E,CAAQ,G,CAAS,G;;AAAsC,I,CAAO,S","file":"<unknown>","sourcesContent":[' + JSON.stringify(css) + ']}');
    });

    describe('check positions', function() {
        var result = csso.minify(css, {
            sourceMap: true
        });
        var consumer = new SourceMapConsumer(result.map.toJSON());

        points.forEach(function(str) {
            describe(str, function() {
                var original = getOriginalPosition(str, css);
                var generated = getGeneratedPosition(str, minifiedCss);

                it('generated->original', function() {
                    assert.deepEqual(consumer.originalPositionFor(generated), original);
                });
                it('original->generated', function() {
                    assert.deepEqual(consumer.generatedPositionFor(original), generated);
                });
            });
        });
    });

    describe('input source map', function() {
        var filename = __dirname + '/fixture/sourceMaps/autoprefixer.css';
        var source = fs.readFileSync(filename, 'utf8');
        var inputSourceMap = JSON.parse(extractSourceMap(source));
        var sourceContent = inputSourceMap.sourcesContent[0];
        var result = csso.minify(source, {
            filename: filename,
            sourceMap: true
        });

        // apply input map
        result.map.applySourceMap(new SourceMapConsumer(inputSourceMap), filename);

        // generated -> original
        var consumer = new SourceMapConsumer(result.map.toJSON());
        var mapping = {
            '.a': '.a',
            '-webkit-fi1ter': 'filter',
            'filter': 'filter',
            '.b': '.b',
            '-webkit-padding-before': 'padding-block-start',
            'padding-block-start': 'padding-block-start'
        };

        Object.keys(mapping).forEach(function(generatedKey) {
            describe(generatedKey, function() {
                var original = getOriginalPosition(mapping[generatedKey], sourceContent, 'source.css');
                var generated = getGeneratedPosition(generatedKey, result.css);

                it('generated->original', function() {
                    assert.deepEqual(consumer.originalPositionFor(generated), original);
                });
                it('original->generated', function() {
                    assert(consumer.allGeneratedPositionsFor(original).some(function(position) {
                        return position.line === generated.line &&
                               position.column === generated.column;
                    }), 'generated position should in generated positions list');
                });
            });
        });
    });
});
