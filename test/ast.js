var assert = require('assert');
var csso = require('../lib/index.js');
var walkAll = require('../lib/utils/walk.js').all;
var walkRules = require('../lib/utils/walk.js').rules;
var walkRulesRight = require('../lib/utils/walk.js').rulesRight;
var translate = require('../lib/utils/translate.js');
var testFiles = require('./fixture/parse').tests;
var forEachTest = require('./fixture/parse').forEachTest;

function expectedWalk(ast) {
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

function createWalkAllTest(name, test, scope) {
    it(name, function() {
        var ast = csso.parse(test.source, scope, true);
        var actual = [];

        walkAll(ast, function(node) {
            actual.push(node.type);
        });

        // type arrays should be equal
        assert.equal(actual.sort().join(','), expectedWalk(test.ast).sort().join(','));
    });
}

function createWalkRulesTest(name, test, scope, walker) {
    it(name, function() {
        var ast = csso.parse(test.source, scope, true);
        var actual = [];

        walker(ast, function(node) {
            actual.push(node.type);
        });

        // type arrays should be equal
        assert.equal(
            actual.sort().join(','),
            expectedWalk(test.ast).filter(function(type) {
                return type === 'Ruleset' || type === 'Atrule';
            }).sort().join(',')
        );
    });
}

function createTranslateTest(name, test, scope) {
    it(name, function() {
        var ast = csso.parse(test.source, scope, true);

        // strings should be equal
        assert.equal(translate(ast), 'translate' in test ? test.translate : test.source);
    });
}

describe('AST', function() {
    describe('walk all', function() {
        forEachTest(createWalkAllTest);
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
                    createWalkRulesTest(file.locator.get(name), file.tests[name], file.scope, walkRules);
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
                    createWalkRulesTest(file.locator.get(name), file.tests[name], file.scope, walkRulesRight);
                }
            }
        };
    });

    describe('translate', function() {
        forEachTest(createTranslateTest);

        assert.throws(function() {
            translate({
                type: 'xxx'
            });
        }, /Unknown node type/);
    });
});
