var assert = require('assert');
var csso = require('../lib/index.js');

describe('AST clone', function() {
    it('compress(ast, { clone: false })', function() {
        var ast = csso.parse('.foo{color:red}.bar{color:#ff0000}');
        var compressedAst = csso.compress(ast, { clone: false }).ast;

        assert.equal(csso.translate(compressedAst), '.bar,.foo{color:red}');
        assert.equal(csso.translate(ast), '.bar,.foo{color:red}');
    });

    it('compress(ast, { clone: true })', function() {
        var ast = csso.parse('.foo{color:red}.bar{color:#ff0000}');
        var compressedAst = csso.compress(ast, { clone: true }).ast;

        assert.equal(csso.translate(compressedAst), '.bar,.foo{color:red}');
        assert.equal(csso.translate(ast), '.foo{color:red}.bar{color:#ff0000}');
    });
});
