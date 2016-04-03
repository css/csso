var assert = require('assert');
var csso = require('../lib/index.js');
var internalWalkAll = require('../lib/compressor/ast/walk.js').all;
var internalWalkRules = require('../lib/compressor/ast/walk.js').rules;
var internalWalkRulesRight = require('../lib/compressor/ast/walk.js').rulesRight;
var internalTranslate = require('../lib/compressor/ast/translate.js');
var testFiles = require('./fixture/parse').tests;
var forEachTest = require('./fixture/parse').forEachTest;
var stringifyInternalAST = require('./helpers/stringify');

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

function createInternalWalkAllTest(name, test, scope) {
    it(name, function() {
        var internalAst = csso.parse(test.source, scope, true);
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
        var actual = [];

        walker(ast, function(node) {
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

        // strings should be equal
        assert.equal(internalTranslate(ast), 'translate' in test ? test.translate : test.source);
    });
}

describe('AST', function() {
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

        assert.throws(function() {
            internalTranslate({
                type: 'xxx'
            });
        }, /Unknown node type/);
    });
});
