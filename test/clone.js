const assert = require('assert');
const csso = require('../lib');

const { compress } = csso;
const { parse, generate } = csso.syntax;

describe('AST clone', () => {
    it('compress(ast, { clone: false })', () => {
        const ast = parse('.foo{color:red}.bar{color:#ff0000}');
        const compressedAst = compress(ast, { clone: false }).ast;

        assert.strictEqual(generate(compressedAst), '.bar,.foo{color:red}');
        assert.strictEqual(generate(ast), '.bar,.foo{color:red}');
    });

    it('compress(ast, { clone: true })', () => {
        const ast = parse('.foo{color:red}.bar{color:#ff0000}');
        const compressedAst = compress(ast, { clone: true }).ast;

        assert.strictEqual(generate(compressedAst), '.bar,.foo{color:red}');
        assert.strictEqual(generate(ast), '.foo{color:red}.bar{color:#ff0000}');
    });
});
