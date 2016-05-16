var assert = require('assert');
var csso = require('../lib/index.js');

function sumMarker(ast) {
    var result = 0;

    csso.walk(ast, function(node) {
        result += node.marker;
    });

    return result;
}

describe('AST clone', function() {
    it('clone()', function() {
        var ast = csso.parse('.test{color:red;}@media foo{div{color:green}}');
        var astCopy = csso.clone(ast);

        csso.walk(ast, function(node) {
            node.marker = 1;
        });

        csso.walk(astCopy, function(node) {
            node.marker = 2;
        });

        assert(sumMarker(ast) > 1);
        assert.equal(sumMarker(ast) * 2, sumMarker(astCopy));
    });

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
