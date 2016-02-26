var assert = require('assert');
var csso = require('../lib/index.js');
var forEachParseTest = require('./fixture/parse').forEachTest;

describe('parse', function() {
    forEachParseTest(function createParseTest(name, test, scope) {
        it(name, function() {
            var ast = csso.parse(test.source, scope);

            // AST should be equal
            assert.equal(csso.stringify(ast), csso.stringify(test.ast));

            // translated AST should be equal to original source
            assert.equal(csso.translate(ast), 'restoredSource' in test ? test.restoredSource : test.source);
        });
    });
});

describe('parse error', function() {
    require('./fixture/parse-errors.json').forEach(function(test) {
        it(test.css, function() {
            var error;

            assert.throws(function() {
                csso.parse(test.css);
            }, function(e) {
                error = e;
                if (e.parseError) {
                    return true;
                }
            }, 'Should be CSS parse error');

            assert.equal(error.message, test.error);
            assert.deepEqual(error.parseError, test.position);
        });
    });
});
