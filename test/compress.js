var path = require('path');
var assert = require('assert');
var csso = require('../lib/index.js');
var translate = require('../lib/utils/translate.js');
var tests = require('./fixture/compress');

function normalize(str) {
    return str.replace(/\n|\r\n?|\f/g, '\n');
}

function createMinifyTest(name, test) {
    var testFn = function() {
        var compressed = csso.minify(test.source);

        assert.equal(normalize(compressed.css), normalize(test.compressed));
    };

    if (path.basename(name)[0] === '_') {
        it.skip(name, testFn);
    } else {
        it(name, testFn);
    }
}

function createCompressTest(name, test) {
    var testFn = function() {
        var ast = csso.parse(test.source);
        var compressedAst = csso.compress(ast).ast;
        var css = translate(compressedAst);

        assert.equal(normalize(css), normalize(test.compressed));
    };

    if (path.basename(name)[0] === '_') {
        it.skip(name, testFn);
    } else {
        it(name, testFn);
    }
};

describe('compress', function() {
    describe('by csso.minify()', function() {
        for (var name in tests) {
            createMinifyTest(name, tests[name]);
        }
    });

    describe('step by step', function() {
        for (var name in tests) {
            createCompressTest(name, tests[name]);
        }
    });

    describe('csso.minifyBlock()', function() {
        it('should compress block', function() {
            var compressed = csso.minifyBlock('color: rgba(255, 0, 0, 1); width: 0px; color: #ff0000');

            assert.equal(compressed.css, 'width:0;color:red');
        });

        it('should not affect options', function() {
            var options = { foo: 1 };

            csso.minifyBlock('', options);

            assert.deepEqual(options, { foo: 1 });
        });
    });

    describe('restructure option', function() {
        var css = '.a{color:red}.b{color:red}';

        it('should apply `restructure` option', function() {
            assert.equal(csso.minify(css, { restructure: false }).css, css);
            assert.equal(csso.minify(css, { restructure: true }).css, '.a,.b{color:red}');
        });

        it('`restructuring` is alias for `restructure`', function() {
            assert.equal(csso.minify(css, { restructuring: false }).css, css);
            assert.equal(csso.minify(css, { restructuring: true }).css, '.a,.b{color:red}');
        });

        it('`restructure` option should has higher priority', function() {
            assert.equal(csso.minify(css, { restructure: false, restructuring: true }).css, css);
            assert.equal(csso.minify(css, { restructure: true, restructuring: false }).css, '.a,.b{color:red}');
        });

        it('should restructure by default', function() {
            assert.equal(csso.minify(css).css, '.a,.b{color:red}');
        });
    });

    describe('specialComments option', function() {
        var css = '/*! first *//*! second *//*! third */';
        var all = '/*! first */\n/*! second */\n/*! third */';

        it('shouldn\'t remove exclamation comments by default', function() {
            assert.equal(csso.minify(css).css, all);
        });

        it('shouldn\'t remove exclamation comments when specialComments is true', function() {
            assert.equal(csso.minify(css, { specialComments: true }).css, all);
        });

        it('shouldn\'t remove exclamation comments when specialComments is "all"', function() {
            assert.equal(csso.minify(css, { specialComments: 'all' }).css, all);
        });

        it('should remove every exclamation comment when specialComments is false', function() {
            assert.equal(csso.minify(css, { specialComments: false }).css, '');
        });

        it('should remove every exclamation comment when specialComments has wrong value', function() {
            assert.equal(csso.minify(css, { specialComments: 'foo' }).css, '');
        });

        it('should remove every exclamation comment except first when specialComments is "first-only"', function() {
            assert.equal(csso.minify(css, { specialComments: 'first-only' }).css, '/*! first */');
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
        assert.equal(translate(csso.compress().ast, true), '');
    });
});
