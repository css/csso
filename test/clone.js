var assert = require('assert');
var csso = require('../lib');
var parse = csso.syntax.parse;
var compress = csso.compress;
var translate = csso.syntax.translate;

describe('AST clone', function() {
    it('compress(ast, { clone: false })', function() {
        var ast = parse('.foo{color:red}.bar{color:#ff0000}');
        var compressedAst = compress(ast, { clone: false }).ast;

        assert.equal(translate(compressedAst), '.bar,.foo{color:red}');
        assert.equal(translate(ast), '.bar,.foo{color:red}');
    });

    it('compress(ast, { clone: true })', function() {
        var ast = parse('.foo{color:red}.bar{color:#ff0000}');
        var compressedAst = compress(ast, { clone: true }).ast;

        assert.equal(translate(compressedAst), '.bar,.foo{color:red}');
        assert.equal(translate(ast), '.foo{color:red}.bar{color:#ff0000}');
    });
});
