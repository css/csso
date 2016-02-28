var path = require('path');
var assert = require('assert');
var csso = require('../lib/index.js');
var JsonLocator = require('./helpers/JsonLocator.js');
var forEachParseTest = require('./fixture/parse').forEachTest;

function createParseErrorTest(location, test, options) {
    it(location + ' ' + JSON.stringify(test.css), function() {
        var error;

        assert.throws(function() {
            csso.parse(test.css, null, options);
        }, function(e) {
            error = e;
            if (e.parseError) {
                return true;
            }
        }, 'Should be CSS parse error');

        assert.equal(error.message, test.error);
        assert.deepEqual(error.parseError, test.position);
    });
}

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
    var filename = __dirname + '/fixture/parse-errors.json';
    var tests = require(filename);
    var locator = new JsonLocator(filename);

    filename = path.relative(__dirname + '/..', filename);

    for (var key in tests) {
        tests[key].name = locator.get(key);
    }

    tests.forEach(function(test) {
        createParseErrorTest(filename, test);
        createParseErrorTest(filename + ' (with positions)', test, { needPositions: true });
    });
});
