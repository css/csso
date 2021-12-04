import { equal, throws } from 'assert';
import { minify } from 'csso';
import tests from './fixture/usage.js';

function normalize(str) {
    return str.replace(/\n|\r\n?|\f/g, '\n');
}

function createCompressWithUsageTest(name, test) {
    it(name, () => {
        const compressed = minify(test.source, {
            usage: test.usage
        });

        equal(normalize(compressed.css), normalize(test.compressed));
    });
}

describe('compress with usage', () => {
    for (const name in tests) {
        createCompressWithUsageTest(name, tests[name]);
    }

    it('should remove selectors with unused things but not an entire rule', () => {
        const compressed = minify('*, .a, #a, a { p: 1 } .b { p: 2 }', {
            usage: {
                tags: [],
                ids: [],
                classes: []
            }
        });

        equal(compressed.css, '*{p:1}');
    });

    it('should ignore wrong values', () => {
        const compressed = minify('#a, .a, a { p: 1 }', {
            usage: {
                tags: true,
                ids: {},
                classes: 'bad value'
            }
        });

        equal(compressed.css, '#a,.a,a{p:1}');
    });

    it('should be case insensitive for tag names', () => {
        const compressed = minify('A, b, c, D { p: 1 }', {
            usage: {
                tags: ['a', 'B']
            }
        });

        equal(compressed.css, 'A,b{p:1}');
    });

    it('should be case sensitive for classes and ids', () => {
        const compressed = minify('.a, .A, #a, #A { p: 1 }', {
            usage: {
                ids: ['a'],
                classes: ['A']
            }
        });

        equal(compressed.css, '#a,.A{p:1}');
    });

    describe('shouldn\'t affect classes whitelist', () => {
        it('when "classes" is defined', () => {
            const compressed = minify('.a, .b { p: 1 }', {
                usage: {
                    classes: ['a'],
                    scopes: [['a'], ['b']]
                }
            });

            equal(compressed.css, '.a{p:1}');
        });

        it('when "classes" isn\'t defined', () => {
            const compressed = minify('.a, .b { p: 1 }', {
                usage: {
                    scopes: [['a'], ['b']]
                }
            });

            equal(compressed.css, '.a,.b{p:1}');
        });
    });

    it('should throw exception when class name specified in several scopes', () => {
        throws(() => {
            minify('.foo { p: 1 }', {
                usage: {
                    scopes: [['foo'], ['foo']]
                }
            });
        }, (error) =>
            error.message === 'Class can\'t be used for several scopes: foo'
        );
    });

    it('should not throw exception when several class names from one scope in single selector', () => {
        const compressed = minify('.foo .bar { p: 1 }', {
            usage: {
                scopes: [['foo', 'bar']]
            }
        });

        equal(compressed.css, '.foo .bar{p:1}');
    });

    it('should throw exception when selector has classes from different scopes', () => {
        throws(() => {
            minify('.a.b { p: 1 }', {
                usage: {
                    scopes: [['a'], ['b']]
                }
            });
        }, ({ message }) =>
            message === 'Selector can\'t has classes from different scopes: .a.b'
        );
    });
});
