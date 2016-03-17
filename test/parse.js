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

describe('positions', function() {
    it('should start with line 1 column 1 by default', function() {
        var ast = csso.parse('.foo.bar {\n  property: value;\n}', null, true);
        var positions = [];

        csso.walk(ast, function(node) {
            positions.push([node[0].line, node[0].column, node[1]]);
        }, true);

        assert.deepEqual(positions, [
            [1, 1, 'stylesheet'],
            [1, 1, 'ruleset'],
            [1, 1, 'selector'],
            [1, 1, 'simpleselector'],
            [1, 1, 'clazz'],
            [1, 2, 'ident'],
            [1, 5, 'clazz'],
            [1, 6, 'ident'],
            [1, 9, 's'],
            [1, 10, 'block'],
            [1, 11, 's'],
            [2, 3, 'declaration'],
            [2, 3, 'property'],
            [2, 3, 'ident'],
            [2, 12, 'value'],
            [2, 12, 's'],
            [2, 13, 'ident'],
            [2, 18, 'decldelim'],
            [2, 19, 's']
        ]);
    });

    it('should start with specified line and column', function() {
        var ast = csso.parse('.foo.bar {\n  property: value;\n}', null, {
            positions: true,
            needInfo: true,
            line: 3,
            column: 5
        });
        var positions = [];

        csso.walk(ast, function(node) {
            positions.push([node[0].line, node[0].column, node[1]]);
        }, true);

        assert.deepEqual(positions, [
            [3, 5, 'stylesheet'],
            [3, 5, 'ruleset'],
            [3, 5, 'selector'],
            [3, 5, 'simpleselector'],
            [3, 5, 'clazz'],
            [3, 6, 'ident'],
            [3, 9, 'clazz'],
            [3, 10, 'ident'],
            [3, 13, 's'],
            [3, 14, 'block'],
            [3, 15, 's'],
            [4, 3, 'declaration'],
            [4, 3, 'property'],
            [4, 3, 'ident'],
            [4, 12, 'value'],
            [4, 12, 's'],
            [4, 13, 'ident'],
            [4, 18, 'decldelim'],
            [4, 19, 's']
        ]);
    });
});
