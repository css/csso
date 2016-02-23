var assert = require('assert');
var csso = require('../lib/index.js');
var gonzalesToInternal = require('../lib/compressor/ast/gonzalesToInternal.js');
var internalToGonzales = require('../lib/compressor/ast/internalToGonzales.js');
var internalWalkAll = require('../lib/compressor/ast/walk.js').all;
var internalWalkRules = require('../lib/compressor/ast/walk.js').rules;
var internalWalkRulesRight = require('../lib/compressor/ast/walk.js').rulesRight;
var internalTranslate = require('../lib/compressor/ast/translate.js');
var testFiles = require('./fixture/internal').tests;
var forEachTest = require('./fixture/internal').forEachTest;

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
                if (key !== 'info' &&
                    key !== 'id' && key !== 'length' &&
                    key !== 'fingerprint' && key !== 'compareMarker' &&
                    key !== 'pseudoSignature' && key !== 'avoidRulesMerge') {
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
