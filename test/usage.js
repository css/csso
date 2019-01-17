const assert = require('assert');
const csso = require('../lib');
const tests = require('./fixture/usage');

function normalize(str) {
    return str.replace(/\n|\r\n?|\f/g, '\n');
}

function createCompressWithUsageTest(name, test) {
    it(name, () => {
        const compressed = csso.minify(test.source, {
            usage: test.usage
        });

        assert.strictEqual(normalize(compressed.css), normalize(test.compressed));
    });
}

describe('compress with usage', () => {
    for (const name in tests) {
        if (Object.prototype.hasOwnProperty.call(tests, name)) {
            createCompressWithUsageTest(name, tests[name]);
        }
    }

    it('should remove selectors with unused things but not an entire rule', () => {
        const compressed = csso.minify('*, .a, #a, a { p: 1 } .b { p: 2 }', {
            usage: {
                tags: [],
                ids: [],
                classes: []
            }
        });

        assert.strictEqual(compressed.css, '*{p:1}');
    });

    it('should ignore wrong values', () => {
        const compressed = csso.minify('#a, .a, a { p: 1 }', {
            usage: {
                tags: true,
                ids: {},
                classes: 'bad value'
            }
        });

        assert.strictEqual(compressed.css, '#a,.a,a{p:1}');
    });

    it('should be case insensitive for tag names', () => {
        const compressed = csso.minify('A, b, c, D { p: 1 }', {
            usage: {
                tags: ['a', 'B']
            }
        });

        assert.strictEqual(compressed.css, 'A,b{p:1}');
    });

    it('should be case sensitive for classes and ids', () => {
        const compressed = csso.minify('.a, .A, #a, #A { p: 1 }', {
            usage: {
                ids: ['a'],
                classes: ['A']
            }
        });

        assert.strictEqual(compressed.css, '#a,.A{p:1}');
    });

    describe('shouldn\'t affect classes whitelist', () => {
        it('when "classes" is defined', () => {
            const compressed = csso.minify('.a, .b { p: 1 }', {
                usage: {
                    classes: ['a'],
                    scopes: [['a'], ['b']]
                }
            });

            assert.strictEqual(compressed.css, '.a{p:1}');
        });

        it('when "classes" isn\'t defined', () => {
            const compressed = csso.minify('.a, .b { p: 1 }', {
                usage: {
                    scopes: [['a'], ['b']]
                }
            });

            assert.strictEqual(compressed.css, '.a,.b{p:1}');
        });
    });

    it('should throw exception when class name specified in several scopes', () => {
        assert.throws(() => {
            csso.minify('.foo { p: 1 }', {
                usage: {
                    scopes: [['foo'], ['foo']]
                }
            });
        }, e => {
            return e.message === 'Class can\'t be used for several scopes: foo';
        });
    });

    it('should not throw exception when several class names from one scope in single selector', () => {
        const compressed = csso.minify('.foo .bar { p: 1 }', {
            usage: {
                scopes: [['foo', 'bar']]
            }
        });

        assert.strictEqual(compressed.css, '.foo .bar{p:1}');
    });

    it('should throw exception when selector has classes from different scopes', () => {
        assert.throws(() => {
            csso.minify('.a.b { p: 1 }', {
                usage: {
                    scopes: [['a'], ['b']]
                }
            });
        }, e => {
            return e.message === 'Selector can\'t has classes from different scopes: .a.b';
        });
    });
});
