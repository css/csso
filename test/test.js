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
var gonzalesTranslate = require('../lib/utils/translate.js');
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
        assert.equal(csso.translate(ast), 'restoredSource' in test ? test.restoredSource : test.source);
    });
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
    return it(name, function() {
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

function createIntenalToGonzalesTest(name, test) {
    return it(name, function() {
        var ast = csso.parse(test.source, 'stylesheet', true);
        var compressed = csso.compress(ast, { outputAst: 'internal' });
        var gonzalesAst = internalToGonzales(compressed);
        var css = internalTranslate(compressed);

        assert.equal(gonzalesTranslate(gonzalesAst, true), css, 'css should be equal');
        try { csso.parse(css) } catch(e) {
            console.log(e, css);
        }
        assert.equal(JSON.stringify(csso.cleanInfo(gonzalesAst)), JSON.stringify(csso.parse(css)), 'ast should be equal');
    });
};

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

    describe('internal AST', function() {
        describe('convertation gonzales->internal', function() {
            var testDir = path.join(__dirname, 'fixture/internal');
            fs.readdirSync(testDir).forEach(function(rule) {
                var tests = require(path.join(testDir, rule));
                var scope = path.basename(rule, path.extname(rule));

                for (var name in tests) {
                    createGonzalesToInternalTest(rule + '/' + name, tests[name], scope);
                }
            });
        });

        describe('convertation internal->gonzales', function() {
            var testDir = path.join(__dirname, 'fixture/internal');
            fs.readdirSync(testDir).forEach(function(rule) {
                var tests = require(path.join(testDir, rule));
                var scope = path.basename(rule, path.extname(rule));

                for (var name in tests) {
                    createInternalToGonzalesTest(rule + '/' + name, tests[name], scope);
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
                createIntenalToGonzalesTest(path.join(path.relative(__dirname + '/..', dir), name + '.css'), tests[name]);
            }
        }

        scan(path.join(__dirname, 'fixture/compress'));

        describe('restructure option', function() {
            var css = '.a{color:red}.b{color:red}';

            it('should apply `restructure` option', function() {
                assert.equal(csso.minify(css, { restructure: false }), css);
                assert.equal(csso.minify(css, { restructure: true }), '.a,.b{color:red}');
            });

            it('`restructuring` is alias for `restructure`', function() {
                assert.equal(csso.minify(css, { restructuring: false }), css);
                assert.equal(csso.minify(css, { restructuring: true }), '.a,.b{color:red}');
            });

            it('`restructure` option should has higher priority', function() {
                assert.equal(csso.minify(css, { restructure: false, restructuring: true }), css);
                assert.equal(csso.minify(css, { restructure: true, restructuring: false }), '.a,.b{color:red}');
            });

            it('should restructure by default', function() {
                assert.equal(csso.minify(css), '.a,.b{color:red}');
            });
        });

        describe('debug option', function() {
            function runDebug(css, options) {
                var output = [];
                var tmp = console.error;

                try {
                    console.error = function() {
                        output.push(Array.prototype.slice.call(arguments).join(' '));
                    };

                    csso.minify(css || '', options);
                } finally {
                    console.error = tmp;
                    return output;
                }
            }

            it('should output nothing to stderr if debug is not set', function() {
                assert(runDebug('.foo { color: red }').length === 0);
                assert(runDebug('.foo { color: red }', { debug: false }).length === 0);
                assert(runDebug('.foo { color: red }', { debug: 0 }).length === 0);
            });

            it('level 1', function() {
                var output = runDebug('.foo { color: red }', { debug: true });
                assert(output.length > 0);
                assert(output.join('').indexOf('.foo') === -1);

                var output = runDebug('.foo { color: red }', { debug: 1 });
                assert(output.length > 0);
                assert(output.join('').indexOf('.foo') === -1);
            });

            it('level 2', function() {
                // should truncate source to 256 chars
                var output = runDebug(new Array(40).join('abcdefgh') + ' { color: red }', { debug: 2 });
                assert(output.length > 0);
                assert(output.join('').indexOf('abcdefgh...') !== -1);
            });

            it('level 3', function() {
                // shouldn't truncate source
                var output = runDebug(new Array(40).join('abcdefgh') + ' { color: red }', { debug: 3 });
                assert(output.length > 0);
                assert(output.join('').indexOf('abcdefgh...') === -1);
            });
        });

        it('should not fail if no ast passed', function() {
            assert.equal(gonzalesTranslate(csso.compress(), true), '');
        });

        it('should return gonzales AST by default', function() {
            var ast = csso.parse('.foo{color:#FF0000}');

            assert.equal(gonzalesTranslate(csso.compress(ast), true), '.foo{color:red}');
        });

        it('should return gonzales AST when outputAst is `gonzales`', function() {
            var ast = csso.parse('.foo{color:#FF0000}');

            assert.equal(gonzalesTranslate(csso.compress(ast, { outputAst: 'gonzales' }), true), '.foo{color:red}');
        });

        it('should return internal when outputAst is not undefined or `gonzales`', function() {
            var ast = csso.parse('.foo{color:#FF0000}');

            assert.equal(internalTranslate(csso.compress(ast, { outputAst: 'internal' })), '.foo{color:red}');
        });
    });

    it('justDoIt() should works until removed', function() {
        assert.equal(
            csso.justDoIt('.foo { color: #ff0000 } .bar { color: rgb(255, 0, 0) }'),
            '.bar,.foo{color:red}'
        );
    });

    it('walk', function() {
        function visit(withInfo) {
            var visitedTypes = {};

            csso.walk(csso.parse('@media (min-width: 200px) { .foo:nth-child(2n) { color: rgb(100%, 10%, 0%); width: calc(3px + 5%) } }', 'stylesheet', withInfo), function(node) {
                visitedTypes[node[withInfo ? 1 : 0]] = true;
            }, withInfo);

            return Object.keys(visitedTypes).sort();
        }

        var shouldVisitTypes = ['stylesheet', 'atruler', 'atkeyword', 'ident', 'atrulerq', 's', 'braces', 'operator', 'dimension', 'number', 'atrulers', 'ruleset', 'selector', 'simpleselector', 'clazz', 'nthselector', 'nth', 'block', 'declaration', 'property', 'value', 'funktion', 'functionBody', 'percentage', 'decldelim', 'unary'].sort();

        assert.deepEqual(visit(), shouldVisitTypes, 'w/o info');
        assert.deepEqual(visit(true), shouldVisitTypes, 'with info');
    });

    it('strigify', function() {
        assert.equal(
            csso.stringify(csso.parse('.a\n{\rcolor:\r\nred}', 'stylesheet', true)),
            fs.readFileSync(__dirname + '/fixture/stringify.txt', 'utf-8').trim()
        );
    });
});
