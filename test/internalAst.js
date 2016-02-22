var fs = require('fs');
var path = require('path');
var assert = require('assert');
var csso = require('../lib/index.js');
var gonzalesToInternal = require('../lib/compressor/ast/gonzalesToInternal.js');
var internalToGonzales = require('../lib/compressor/ast/internalToGonzales.js');
var internalWalkAll = require('../lib/compressor/ast/walk.js').all;
var internalWalkRules = require('../lib/compressor/ast/walk.js').rules;
var internalWalkRulesRight = require('../lib/compressor/ast/walk.js').rulesRight;
var internalTranslate = require('../lib/compressor/ast/translate.js');
var JsonLocator = require('./helpers/JsonLocator.js');

function stringifyInternalAST(ast) {
    function clean(source) {
        if (source && typeof source.toJSON === 'function') {
            source = source.toJSON();
        }

        if (Array.isArray(source)) {
            return source.map(clean);
        }

        if (source && typeof source === 'object') {
            var result = {};
            for (var key in source) {
                if (key !== 'parent' && key !== 'info' &&
                    key !== 'id' && key !== 'length' &&
                    key !== 'fingerprint' && key !== 'compareMarker') {
                    result[key] = clean(source[key]);
                }
            }
            return result;
        }

        return source;
    }

    return JSON.stringify(clean(ast), null, 2);
}

function expectedInternalWalk(ast) {
    function walk(node) {
        result.push(node.type);
        for (var key in node) {
            if (key !== 'parent' && key !== 'info') {
                if (Array.isArray(node[key])) {
                    node[key].forEach(walk);
                } else if (node[key] && typeof node[key] === 'object') {
                    walk(node[key]);
                }
            }
        }
    }

    var result = [];
    walk(ast);
    return result;
}

function createGonzalesToInternalTest(name, test, scope) {
    return it(name, function() {
        var gonzalesAst = csso.parse(test.source, scope, true);
        var internalAst = gonzalesToInternal(gonzalesAst);

        assert.equal(
            stringifyInternalAST(internalAst),
            stringifyInternalAST(test.ast)
        );
    });
}

function createInternalToGonzalesTest(name, test, scope) {
    it(name, function() {
        var gonzalesAst = csso.parse(test.source, scope, true);
        var internalAst = gonzalesToInternal(gonzalesAst);
        var restoredCSS = scope === 'block'
            // gonzales parser requires curly braces to parse CSS block correctly
            ? '{' + internalTranslate(internalAst) + '}'
            : internalTranslate(internalAst);

        // restored gonzales AST should be equal to AST from CSS parser
        assert.equal(
            JSON.stringify(csso.cleanInfo(internalToGonzales(internalAst))),
            JSON.stringify(csso.parse(restoredCSS, scope))
        );
    });
}

function createInternalWalkAllTest(name, test, scope) {
    it(name, function() {
        var ast = csso.parse(test.source, scope, true);
        var internalAst = gonzalesToInternal(ast);
        var actual = [];

        internalWalkAll(internalAst, function(node) {
            actual.push(node.type);
        });

        // type arrays should be equal
        assert.equal(actual.sort().join(','), expectedInternalWalk(test.ast).sort().join(','));
    });
}

function createInternalWalkRulesTest(name, test, scope, walker) {
    it(name, function() {
        var ast = csso.parse(test.source, scope, true);
        var internalAst = gonzalesToInternal(ast);
        var actual = [];

        walker(internalAst, function(node) {
            actual.push(node.type);
        });

        // type arrays should be equal
        assert.equal(
            actual.sort().join(','),
            expectedInternalWalk(test.ast).filter(function(type) {
                return type === 'Ruleset' || type === 'Atrule';
            }).sort().join(',')
        );
    });
}

function createInternalTranslateTest(name, test, scope) {
    it(name, function() {
        var ast = csso.parse(test.source, scope, true);
        var internalAst = gonzalesToInternal(ast);

        // strings should be equal
        assert.equal(internalTranslate(internalAst), test.translate);
    });
}

function forEachTest(factory) {
    for (var filename in testFiles) {
        var file = testFiles[filename];

        for (var key in file.tests) {
            factory(file.tests[key].name, file.tests[key], file.scope);
        }
    };
}

var testDir = path.join(__dirname, 'fixture/internal');
var testFiles = fs.readdirSync(testDir).reduce(function(result, rule) {
    var filename = path.join(testDir, rule);
    var tests = require(filename);
    var locator = new JsonLocator(filename);

    for (var key in tests) {
        tests[key].name = locator.get(key);
    }

    result[filename] = {
        scope: path.basename(rule, path.extname(rule)),
        tests: tests
    };

    return result;
}, {});

describe('internal AST', function() {
    describe('transform gonzales->internal', function() {
        forEachTest(createGonzalesToInternalTest);
    });

    describe('transform internal->gonzales', function() {
        forEachTest(createInternalToGonzalesTest);
    });

    describe('walk all', function() {
        forEachTest(createInternalWalkAllTest);
    });

    describe('walk ruleset', function() {
        for (var filename in testFiles) {
            var file = testFiles[filename];

            if (filename === 'atruleb.json' ||
                filename === 'atruler.json' ||
                filename === 'atrules.json' ||
                filename === 'stylesheet.json' ||
                filename === 'ruleset.json') {
                for (var name in file.tests) {
                    createInternalWalkRulesTest(file.locator.get(name), file.tests[name], file.scope, internalWalkRules);
                }
            }
        };
    });

    describe('walk rulesetRight', function() {
        for (var filename in testFiles) {
            var file = testFiles[filename];

            if (filename === 'atruleb.json' ||
                filename === 'atruler.json' ||
                filename === 'atrules.json' ||
                filename === 'stylesheet.json' ||
                filename === 'ruleset.json') {
                for (var name in file.tests) {
                    createInternalWalkRulesTest(file.locator.get(name), file.tests[name], file.scope, internalWalkRulesRight);
                }
            }
        };
    });

    describe('translate', function() {
        forEachTest(createInternalTranslateTest);
    });
});
