var assert = require('assert');
var csso = require('../lib');
var tests = require('./fixture/usage');

function normalize(str) {
    return str.replace(/\n|\r\n?|\f/g, '\n');
}

function createCompressWithUsageTest(name, test) {
    it(name, function() {
        var compressed = csso.minify(test.source, {
            usage: test.usage
        });

        assert.equal(normalize(compressed.css), normalize(test.compressed));
    });
}

describe('compress with usage', function() {
    for (var name in tests) {
        createCompressWithUsageTest(name, tests[name]);
    }

    it('should remove selectors with unused things but not an entire rule', function() {
        var compressed = csso.minify('*, .a, #a, a { p: 1 } .b { p: 2 }', {
            usage: {
                tags: [],
                ids: [],
                classes: []
            }
        });

        assert.equal(compressed.css, '*{p:1}');
    });

    it('should ignore wrong values', function() {
        var compressed = csso.minify('#a, .a, a { p: 1 }', {
            usage: {
                tags: true,
                ids: {},
                classes: 'bad value'
            }
        });

        assert.equal(compressed.css, '#a,.a,a{p:1}');
    });

    it('should be case insensitive for tag names', function() {
        var compressed = csso.minify('A, b, c, D { p: 1 }', {
            usage: {
                tags: ['a', 'B']
            }
        });

        assert.equal(compressed.css, 'A,b{p:1}');
    });

    it('should be case sensitive for classes and ids', function() {
        var compressed = csso.minify('.a, .A, #a, #A { p: 1 }', {
            usage: {
                ids: ['a'],
                classes: ['A']
            }
        });

        assert.equal(compressed.css, '#a,.A{p:1}');
    });

    describe('shouldn\'t affect classes allowlist', function() {
        it('when "classes" is defined', function() {
            var compressed = csso.minify('.a, .b { p: 1 }', {
                usage: {
                    classes: ['a'],
                    scopes: [['a'], ['b']]
                }
            });

            assert.equal(compressed.css, '.a{p:1}');
        });

        it('when "classes" isn\'t defined', function() {
            var compressed = csso.minify('.a, .b { p: 1 }', {
                usage: {
                    scopes: [['a'], ['b']]
                }
            });

            assert.equal(compressed.css, '.a,.b{p:1}');
        });
    });

    it('should throw exception when class name specified in several scopes', function() {
        assert.throws(function() {
            csso.minify('.foo { p: 1 }', {
                usage: {
                    scopes: [['foo'], ['foo']]
                }
            });
        }, function(e) {
            return e.message === 'Class can\'t be used for several scopes: foo';
        });
    });

    it('should not throw exception when several class names from one scope in single selector', function() {
        var compressed = csso.minify('.foo .bar { p: 1 }', {
            usage: {
                scopes: [['foo', 'bar']]
            }
        });

        assert.equal(compressed.css, '.foo .bar{p:1}');
    });

    it('should throw exception when selector has classes from different scopes', function() {
        assert.throws(function() {
            csso.minify('.a.b { p: 1 }', {
                usage: {
                    scopes: [['a'], ['b']]
                }
            });
        }, function(e) {
            return e.message === 'Selector can\'t has classes from different scopes: .a.b';
        });
    });
});
