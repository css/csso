var assert = require('assert');
var csso = require('../lib/index.js');

describe('rename', function() {
    it('basic', function() {
        var result = csso.minify('.foo, .bar.foo { color: red }', {
            rename: { classes: true }
        });

        assert.equal(result.css, '.a.b,.b{color:red}');
        assert.deepEqual(result.rename.classes, {
            bar: 'a',
            foo: 'b'
        });
    });
});

