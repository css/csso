var assert = require('assert');
var csso = require('../lib/index.js');
var tests = require('./fixture/usage');

function normalize(str) {
    return str.replace(/\n|\r\n?|\f/g, '\n');
}

function createCompressWithUsageTest(name, test) {
    it(name, function() {
        var compressed = csso.minify(test.source, {
            usage: test.usage
        });

        assert.equal(normalize(compressed), normalize(test.compressed));
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

        assert.equal(compressed, '*{p:1}');
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
