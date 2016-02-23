var assert = require('assert');
var csso = require('../lib/index.js');
var SourceMapConsumer = require('source-map').SourceMapConsumer;
var gonzalesToInternal = require('../lib/compressor/ast/gonzalesToInternal.js');
var internalTranslateWithSourceMap = require('../lib/compressor/ast/translateWithSourceMap.js');
var forEachTest = require('./fixture/internal').forEachTest;
var css = '.a { color: #ff0000; }\n.b { display: block; float: left; }';
var minifiedCss = '.a{color:red}.b{display:block;float:left}';
var anonymousMap = defineSourceMap('<unknown>');
var filenameMap = defineSourceMap('test.css');
var points = ['.a', 'color', '.b', 'display', 'float'];

function getOriginalPosition(str, source, filename) {
    var lines = source.substr(0, source.indexOf(str)).split('\n');
    return {
        line: lines.length,
        column: lines.pop().length,
        name: null,
        source: filename || '<unknown>'
    };
}

function getGeneratedPosition(str, source) {
    var lines = source.substr(0, source.indexOf(str)).split('\n');
    return {
        line: lines.length,
        column: lines.pop().length,
        lastColumn: null
    };
}

function defineSourceMap(filename) {
    var string = '{"version":3,"sources":["' + filename + '"],"names":[],"mappings":"AAAA,E,CAAK,S,CACL,E,CAAK,a,CAAgB,U","sourcesContent":[' + JSON.stringify(css) + ']}';
    var base64 = new Buffer(string, 'utf8').toString('base64');
    var inline = '/*# sourceMappingURL=data:application/json;base64,' + base64 + ' */';

    return {
        string: string,
        base64: base64,
        inline: inline
    };
}

function createInternalTranslateWidthSourceMapTest(name, test, scope) {
    it(name, function() {
        var ast = csso.parse(test.source, scope, true);
        var internalAst = gonzalesToInternal(ast);

        // strings should be equal
        assert.equal(internalTranslateWithSourceMap(internalAst).css, test.translate);
    });
}

describe('sourceMaps', function() {
    describe('translateWithSourceMap', function() {
        forEachTest(createInternalTranslateWidthSourceMapTest);
    });

    it('should return object if sourceMap is true', function() {
        var result = csso.minify(css, { sourceMap: true });

        assert(typeof result === 'object');
        assert('css' in result, 'should has `css` property');
        assert('map' in result, 'should has `map` property');
    });

    it('should return object if sourceMap is truly value', function() {
        var result = csso.minify(css, { sourceMap: 'anything' });

        assert(typeof result === 'object');
        assert('css' in result, 'should has `css` property');
        assert('map' in result, 'should has `map` property');
    });

    it('should return object if sourceMap is `inline`', function() {
        var result = csso.minify(css, { sourceMap: 'inline' });

        assert(typeof result === 'object');
        assert('css' in result, 'should has `css` property');
        assert('map' in result, 'should has `map` property');
    });

    it('should not add inline map when sourceMap is not `inline`', function() {
        var result = csso.minify(css, {
            sourceMap: true
        });

        assert.equal(result.css, minifiedCss);
    });

    it('should add inline map when sourceMap is `inline` and no filename', function() {
        var result = csso.minify(css, {
            sourceMap: 'inline'
        });

        assert.equal(result.css, minifiedCss + '\n' + anonymousMap.inline);
    });

    it('should add inline map when sourceMap is `inline` and filename', function() {
        var result = csso.minify(css, {
            sourceMap: 'inline',
            filename: 'test.css'
        });

        assert.equal(result.css, minifiedCss + '\n' + filenameMap.inline);
    });

    describe('check positions', function() {
        var result = csso.minify(css, {
            sourceMap: true
        });
        var consumer = new SourceMapConsumer(result.map.toString());

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
});
