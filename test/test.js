var fs = require('fs');
var path = require('path');
var assert = require('assert');
var csso = require('../lib/index.js');
var gonzalesToInternal = require('../lib/compressor/ast/gonzalesToInternal.js');
var internalWalkAll = require('../lib/compressor/ast/walk.js').all;
var internalWalkRules = require('../lib/compressor/ast/walk.js').rules;
var internalWalkRulesRight = require('../lib/compressor/ast/walk.js').rulesRight;
var internalTranslate = require('../lib/compressor/ast/translate.js');
var specificity = require('../lib/compressor/restructure/prepare/specificity.js');

function normalize(str) {
    return str.replace(/\n|\r\n?|\f/g, '\n');
}

function stringifyInternalAST(ast) {
    function clean(source) {
        if (Array.isArray(source)) {
            return source.map(clean);
        }

        if (source && typeof source === 'object') {
            var result = {};
            for (var key in source) {
                if (key !== 'parent' && key !== 'info') {
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

function createParseTest(name, test, scope) {
    return it(name, function() {
        var ast = csso.parse(test.source, scope);

        // AST should be equal
        assert.equal(csso.stringify(ast), csso.stringify(test.ast));

        // translated AST should be equal to original source
        assert.equal(csso.translate(ast), test.source);
    });
}

function createInternalFormatTest(name, test, scope) {
    return it(name, function() {
        var ast = csso.parse(test.source, scope, true);
        var internalAst = gonzalesToInternal(ast);

        // AST should be equal
        assert.equal(stringifyInternalAST(internalAst), stringifyInternalAST(test.ast));
    });
}

function createInternalWalkAllTest(name, test, scope) {
    return it(name, function() {
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
    return it(name, function() {
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
    return it(name, function() {
        var ast = csso.parse(test.source, scope, true);
        var internalAst = gonzalesToInternal(ast);

        // strings should be equal
        assert.equal(internalTranslate(internalAst), test.translate);
    });
}

function createSpecificityTest(test) {
    return it(test.selector, function() {
        var ast = gonzalesToInternal(csso.parse(test.selector, 'simpleselector', true));

        assert.equal(String(specificity(ast)), test.expected);
    });
}

function createCompressTest(name, test) {
    var testFn = function() {
        var compressed = csso.minify(test.source);

        assert.equal(normalize(compressed), normalize(test.compressed));
    };

    return path.basename(name)[0] === '_'
        ? it.skip(name, testFn)
        : it(name, testFn);
}

describe('csso', function() {
    describe('parse', function() {
        var testDir = path.join(__dirname, 'fixture/parse');
        fs.readdirSync(testDir).forEach(function(rule) {
            var tests = require(path.join(testDir, rule));
            var scope = path.basename(rule, path.extname(rule));

            for (var name in tests) {
                createParseTest(name, tests[name], scope);
            }
        });
    });

    describe('internal', function() {
        describe('gonzalesToInternal', function() {
            var testDir = path.join(__dirname, 'fixture/internal');
            fs.readdirSync(testDir).forEach(function(rule) {
                var tests = require(path.join(testDir, rule));
                var scope = path.basename(rule, path.extname(rule));

                for (var name in tests) {
                    createInternalFormatTest(rule + '/' + name, tests[name], scope);
                }
            });
        });

        describe('walk all', function() {
            var testDir = path.join(__dirname, 'fixture/internal');
            fs.readdirSync(testDir).forEach(function(rule) {
                var tests = require(path.join(testDir, rule));
                var scope = path.basename(rule, path.extname(rule));

                for (var name in tests) {
                    createInternalWalkAllTest(rule + '/' + name, tests[name], scope);
                }
            });
        });

        describe('walk ruleset', function() {
            var testDir = path.join(__dirname, 'fixture/internal');
            fs.readdirSync(testDir).forEach(function(rule) {
                var tests = require(path.join(testDir, rule));
                var scope = path.basename(rule, path.extname(rule));

                if (rule === 'atruleb.json' ||
                    rule === 'atruler.json' ||
                    rule === 'atrules.json' ||
                    rule === 'stylesheet.json' ||
                    rule === 'ruleset.json') {
                    for (var name in tests) {
                        createInternalWalkRulesTest(rule + '/' + name, tests[name], scope, internalWalkRules);
                    }
                }
            });
        });

        describe('walk rulesetRight', function() {
            var testDir = path.join(__dirname, 'fixture/internal');
            fs.readdirSync(testDir).forEach(function(rule) {
                var tests = require(path.join(testDir, rule));
                var scope = path.basename(rule, path.extname(rule));

                if (rule === 'atruleb.json' ||
                    rule === 'atruler.json' ||
                    rule === 'atrules.json' ||
                    rule === 'stylesheet.json' ||
                    rule === 'ruleset.json') {
                    for (var name in tests) {
                        createInternalWalkRulesTest(rule + '/' + name, tests[name], scope, internalWalkRulesRight);
                    }
                }
            });
        });

        describe('translate', function() {
            var testDir = path.join(__dirname, 'fixture/internal');
            fs.readdirSync(testDir).forEach(function(rule) {
                var tests = require(path.join(testDir, rule));
                var scope = path.basename(rule, path.extname(rule));

                for (var name in tests) {
                    createInternalTranslateTest(rule + '/' + name, tests[name], scope);
                }
            });
        });
    });

    describe('specificity', function() {
        var tests = fs
            .readFileSync(__dirname + '/fixture/specificity.json', 'utf8')
            .replace(/\/\/.+/g, '');

        JSON.parse(tests).forEach(createSpecificityTest);
    });

    describe('compress', function() {
        function scan(dir) {
            var tests = fs.readdirSync(dir).reduce(function(list, filename) {
                var fullpath = path.join(dir, filename);

                // nested dir
                if (fs.statSync(fullpath).isDirectory()) {
                    scan(fullpath);
                    return list;
                }

                var name = filename.replace(/(\.min)?\.css$/, '');
                var key = /\.min\.css/.test(filename) ? 'compressed' : 'source';

                // in case there is a filename that doesn't ends with `.css` or `.min.css`
                if (name !== filename) {
                    if (!list[name]) {
                        list[name] = {};
                    }

                    list[name][key] = fs.readFileSync(fullpath, 'utf8').trim();
                }

                return list;
            }, {});

            for (var name in tests) {
                createCompressTest(path.join(path.relative(__dirname + '/..', dir), name + '.css'), tests[name]);
            }
        }

        scan(path.join(__dirname, 'fixture/compress'));

        it('restructuring option', function() {
            var css = '.a{color:red}.b{color:red}';

            assert.equal(csso.minify(css, { restructuring: false }), css);
            assert.equal(csso.minify(css, { restructuring: true }), '.a,.b{color:red}');
            assert.equal(csso.minify(css), '.a,.b{color:red}');
        });

        it('debug option', function() {
            try {
                var counter = 0;
                var tmp = console.error;
                console.error = function() {
                    counter++;
                };

                csso.minify('', { debug: true });

                // should output something
                assert(counter > 0, 'should output info when debug is on');
            } finally {
                console.error = tmp;
            }
        });

        it('should compress ast w/o info', function() {
            var ast = csso.parse('.foo{color:#FF0000}');

            assert.equal(ast[0], 'stylesheet');
            assert.equal(internalTranslate(csso.compress(ast)), '.foo{color:red}');
        });
    });
});
