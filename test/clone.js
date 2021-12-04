import { equal } from 'assert';
import { syntax } from 'csso';

const { parse, compress, generate } = syntax;

describe('AST clone', () => {
    it('compress(ast, { clone: false })', () => {
        const ast = parse('.foo{color:red}.bar{color:#ff0000}');
        const { ast: compressedAst } = compress(ast, { clone: false });

        equal(generate(compressedAst), '.bar,.foo{color:red}');
        equal(generate(ast), '.bar,.foo{color:red}');
    });

    it('compress(ast, { clone: true })', () => {
        const ast = parse('.foo{color:red}.bar{color:#ff0000}');
        const { ast: compressedAst } = compress(ast, { clone: true });

        equal(generate(compressedAst), '.bar,.foo{color:red}');
        equal(generate(ast), '.foo{color:red}.bar{color:#ff0000}');
    });
});
