const path = require('path');
const assert = require('assert');
const csso = require('../lib');

const { compress } = csso;
const { parse, walk, generate } = csso.syntax;
const tests = require('./fixture/compress');

function normalize(str) {
    return (str || '').replace(/\n|\r\n?|\f/g, '\n');
}

function createCompressTest(name, test) {
    const testFn = () => {
        const compressed = csso.minify(test.source, test.options);

        assert.strictEqual(normalize(compressed.css), normalize(test.compressed), 'compress by minify()');

        const ast = parse(test.source);
        const compressedAst = compress(ast, test.options).ast;
        const css = generate(compressedAst);

        assert.strictEqual(normalize(css), normalize(test.compressed), 'compress step by step');
    };

    if (path.basename(name)[0] === '_') {
        it.skip(name, testFn);
    } else {
        it(name, testFn);
    }
}

describe('compress', () => {
    for (const name in tests) {
        if (Object.prototype.hasOwnProperty.call(tests, name)) {
            createCompressTest(name, tests[name]);
        }
    }

    it('should remove white spaces in transformed AST', () => {
        const WHITESPACE = {
            type: 'WhiteSpace',
            loc: null,
            value: ' '
        };
        const ast = parse(
            '.a { border: 1px solid red; display: block } .b { color: red }' +
            '@media all { .a { border: 1px solid red; display: block } .b { color: red } }'
        );

        // add white spaces
        walk(ast, node => {
            // don't touch some lists
            if (node.type === 'SelectorList' ||
                node.type === 'MediaQueryList') {
                return;
            }

            // insert white spaces in the beginning, in the ending and between items
            if (node.children) {
                node.children.each((node, item, list) => {
                    list.insertData(WHITESPACE, item);
                });
                node.children.appendData(WHITESPACE);
            }
        });

        assert.strictEqual(
            generate(compress(ast).ast),
            '.a{border:1px solid red;display:block}.b{color:red}@media all{.a{border:1px solid red;display:block}.b{color:red}}'
        );
    });

    describe('should return the same ast as input by default', () => {
        it('compress stylesheet', () => {
            const ast = parse('.test{color:red}');
            const resultAst = compress(ast).ast;

            assert(ast === resultAst);
        });

        it('compress block', () => {
            const ast = parse('color:#ff0000;width:1px', { context: 'declarationList' });
            const resultAst = compress(ast).ast;

            assert(ast === resultAst);
            assert.strictEqual(generate(ast), 'color:red;width:1px');
        });
    });

    describe('csso.minifyBlock()', () => {
        it('should compress block', () => {
            const compressed = csso.minifyBlock('color: rgba(255, 0, 0, 1); width: 0px; color: #ff0000');

            assert.strictEqual(compressed.css, 'width:0;color:red');
        });

        it('should not affect options', () => {
            const options = { foo: 1 };

            csso.minifyBlock('', options);

            assert.deepStrictEqual(options, { foo: 1 });
        });
    });

    describe('restructure option', () => {
        const css = '.a{color:red}.b{color:red}';

        it('should apply `restructure` option', () => {
            assert.strictEqual(csso.minify(css, { restructure: false }).css, css);
            assert.strictEqual(csso.minify(css, { restructure: true }).css, '.a,.b{color:red}');
        });

        it('`restructuring` is alias for `restructure`', () => {
            assert.strictEqual(csso.minify(css, { restructuring: false }).css, css);
            assert.strictEqual(csso.minify(css, { restructuring: true }).css, '.a,.b{color:red}');
        });

        it('`restructure` option should has higher priority', () => {
            assert.strictEqual(csso.minify(css, { restructure: false, restructuring: true }).css, css);
            assert.strictEqual(csso.minify(css, { restructure: true, restructuring: false }).css, '.a,.b{color:red}');
        });

        it('should restructure by default', () => {
            assert.strictEqual(csso.minify(css).css, '.a,.b{color:red}');
        });
    });

    describe('comments option', () => {
        const css = '/*! first *//*! second *//*! third */';
        const all = '/*! first */\n/*! second */\n/*! third */';

        it('shouldn\'t remove exclamation comments by default', () => {
            assert.strictEqual(csso.minify(css).css, all);
        });

        it('shouldn\'t remove exclamation comments when comments is true', () => {
            assert.strictEqual(csso.minify(css, { comments: true }).css, all);
        });

        it('shouldn\'t remove exclamation comments when comments is "exclamation"', () => {
            assert.strictEqual(csso.minify(css, { comments: 'exclamation' }).css, all);
        });

        it('should remove every exclamation comment when comments is false', () => {
            assert.strictEqual(csso.minify(css, { comments: false }).css, '');
        });

        it('should remove every exclamation comment when comments is "none"', () => {
            assert.strictEqual(csso.minify(css, { comments: 'none' }).css, '');
        });

        it('should remove every exclamation comment when comments has wrong value', () => {
            assert.strictEqual(csso.minify(css, { comments: 'foo' }).css, '');
        });

        it('should remove every exclamation comment except first when comments is "first-exclamation"', () => {
            assert.strictEqual(csso.minify(css, { comments: 'first-exclamation' }).css, '/*! first */');
        });
    });

    describe('debug option', () => {
        function runDebug(css, options) {
            const output = [];
            const tmp = console.error;

            try {
                console.error = (...args) => {
                    output.push(Array.prototype.slice.call(args).join(' '));
                };

                csso.minify(css || '', options);
            } finally {
                console.error = tmp;
                return output; // eslint-disable-line no-unsafe-finally
            }
        }

        it('should output nothing to stderr if debug is not set', () => {
            assert(runDebug('.foo { color: red }').length === 0);
            assert(runDebug('.foo { color: red }', { debug: false }).length === 0);
            assert(runDebug('.foo { color: red }', { debug: 0 }).length === 0);
        });

        it('level 1', () => {
            let output = runDebug('.foo { color: red }', { debug: true });
            assert(output.length > 0);
            assert(!output.join('').includes('.foo'));

            output = runDebug('.foo { color: red }', { debug: 1 });
            assert(output.length > 0);
            assert(!output.join('').includes('.foo'));
        });

        it('level 2', () => {
            // should truncate source to 256 chars
            const output = runDebug(`${new Array(40).join('abcdefgh')} { color: red }`, { debug: 2 });
            assert(output.length > 0);
            assert(output.join('').includes('abcdefgh...'));
        });

        it('level 3', () => {
            // shouldn't truncate source
            const output = runDebug(`${new Array(40).join('abcdefgh')} { color: red }`, { debug: 3 });
            assert(output.length > 0);
            assert(!output.join('').includes('abcdefgh...'));
        });
    });

    it('should not fail if no ast passed', () => {
        assert.strictEqual(generate(compress().ast, true), '');
    });
});
