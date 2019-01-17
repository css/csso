const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { SourceMapConsumer } = require('source-map');
const csso = require('../lib');

const css = '.a { color: #ff0000; }\n.b { display: block; float: left; }';
const minifiedCss = '.a{color:red}.b{display:block;float:left}';
const anonymousMap = defineSourceMap('<unknown>');
const filenameMap = defineSourceMap('test.css');
const points = ['.a', 'color', '.b', 'display', 'float'];

function getOriginalPosition(str, source, filename) {
    const index = source.indexOf(str);
    let line = null;
    let column = null;

    if (index !== -1) {
        const lines = source.substr(0, index).split('\n');
        line = lines.length;
        column = lines.pop().length;
    }

    return {
        source: filename || '<unknown>',
        line,
        column,
        name: null
    };
}

function getGeneratedPosition(str, source) {
    const index = source.indexOf(str);
    let line = null;
    let column = null;

    if (index !== -1) {
        const lines = source.substr(0, index).split('\n');
        line = lines.length;
        column = lines.pop().length;
    }

    return {
        line,
        column,
        lastColumn: null
    };
}

function defineSourceMap(filename) {
    const string = `{"version":3,"sources":["${filename}"],"names":[],"mappings":"AAAA,E,CAAK,S,CACL,E,CAAK,a,CAAgB,U","file":"${filename}","sourcesContent":[${JSON.stringify(css)}]}`;
    const base64 = Buffer.from(string, 'utf8').toString('base64');
    const inline = `/*# sourceMappingURL=data:application/json;base64,${base64} */`;

    return {
        string,
        base64,
        inline
    };
}

function extractSourceMap(source) {
    const m = source.match(/\/\*# sourceMappingURL=data:application\/json;base64,(.+) \*\//);

    if (m) {
        return Buffer.from(m[1], 'base64').toString();
    }
}

describe('sourceMaps', () => {
    it('should return object when sourceMap is true', () => {
        const result = csso.minify(css, {
            sourceMap: true
        });

        assert(typeof result === 'object');
        assert('css' in result, 'should has `css` property');
        assert('map' in result, 'should has `map` property');
        assert.strictEqual(result.css, minifiedCss);
        assert.strictEqual(result.map.toString(), anonymousMap.string);
    });

    it('should use passed filename in map', () => {
        const result = csso.minify(css, {
            sourceMap: true,
            filename: 'test.css'
        });

        assert.strictEqual(result.css, minifiedCss);
        assert.strictEqual(result.map.toString(), filenameMap.string);
    });

    it('should store both position on block merge', () => {
        const css =
            '/*! check location merge */.a {a:1;a:2} .a {b:2}' +
            '/*! several exlamation comments */.foo { color: red }';
        const result = csso.minify(css, {
            sourceMap: true
        });

        assert.strictEqual(result.css,
            '/*! check location merge */\n.a{a:2;b:2}\n' +
            '/*! several exlamation comments */\n.foo{color:red}');
        assert.strictEqual(result.map.toString(), `{"version":3,"sources":["<unknown>"],"names":[],"mappings":";AAA2B,E,CAAQ,G,CAAS,G;;AAAsC,I,CAAO,S","file":"<unknown>","sourcesContent":[${JSON.stringify(css)}]}`);
    });

    describe('check positions', () => {
        const result = csso.minify(css, {
            sourceMap: true
        });
        const consumer = new SourceMapConsumer(result.map.toJSON());

        points.forEach(str => {
            describe(str, () => {
                const original = getOriginalPosition(str, css);
                const generated = getGeneratedPosition(str, minifiedCss);

                it('generated->original', () => {
                    assert.deepStrictEqual(consumer.originalPositionFor(generated), original);
                });
                it('original->generated', () => {
                    assert.deepStrictEqual(consumer.generatedPositionFor(original), generated);
                });
            });
        });
    });

    describe('input source map', () => {
        const filename = path.join(__dirname, '/fixture/sourceMaps/autoprefixer.css');
        const source = fs.readFileSync(filename, 'utf8');
        const inputSourceMap = JSON.parse(extractSourceMap(source));
        const sourceContent = inputSourceMap.sourcesContent[0];
        const result = csso.minify(source, {
            filename,
            sourceMap: true
        });

        // apply input map
        result.map.applySourceMap(new SourceMapConsumer(inputSourceMap), filename);

        // generated -> original
        const consumer = new SourceMapConsumer(result.map.toJSON());
        const mapping = {
            '.a': '.a',
            '-webkit-fi1ter': 'filter',
            'filter': 'filter',
            '.b': '.b',
            '-webkit-padding-before': 'padding-block-start',
            'padding-block-start': 'padding-block-start'
        };

        Object.keys(mapping).forEach(generatedKey => {
            describe(generatedKey, () => {
                const original = getOriginalPosition(mapping[generatedKey], sourceContent, 'source.css');
                const generated = getGeneratedPosition(generatedKey, result.css);

                it('generated->original', () => {
                    assert.deepStrictEqual(consumer.originalPositionFor(generated), original);
                });
                it('original->generated', () => {
                    assert(consumer.allGeneratedPositionsFor(original).some(position => {
                        return position.line === generated.line &&
                               position.column === generated.column;
                    }), 'generated position should in generated positions list');
                });
            });
        });
    });
});
