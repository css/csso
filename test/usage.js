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
});
