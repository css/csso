var fs = require('fs');
var path = require('path');
var assert = require('assert');
var csso = require('../lib/index.js');
var JsonLocator = require('./helpers/JsonLocator.js');

function createParseTest(name, test, scope) {
    it(name, function() {
        var ast = csso.parse(test.source, scope);

        // AST should be equal
        assert.equal(csso.stringify(ast), csso.stringify(test.ast));

        // translated AST should be equal to original source
        assert.equal(csso.translate(ast), 'restoredSource' in test ? test.restoredSource : test.source);
    });
}

describe('parse', function() {
    var testDir = path.join(__dirname, 'fixture/parse');

    fs.readdirSync(testDir).forEach(function(rule) {
        var filename = path.join(testDir, rule);
        var tests = require(path.join(testDir, rule));
        var scope = path.basename(rule, path.extname(rule));
        var locator = new JsonLocator(filename);

        for (var name in tests) {
            createParseTest(locator.get(name), tests[name], scope);
        }
    });
});
