var assert = require('assert');
var path = require('path');
var csso = require('../lib/index.js');
var tests = require('./fixture/rename');

function createRenameTest(name, test) {
    var testFn = function() {
        var result = csso.minify(test.source, {
            rename: { classes: true }
        });

        assert.equal(result.css, test.compressed);
        assert.deepEqual(result.rename, test.map);
    };

    if (path.basename(name)[0] === '_') {
        it.skip(name, testFn);
    } else {
        it(name, testFn);
    }
};

describe.only('rename', function() {
    it('basic', function() {
        var result = csso.minify('.foo, .bar.foo, foo:not(.bar) { color: foo }', {
            rename: { classes: true }
        });

        assert.equal(result.css, '.a,.b.a,foo:not(.b){color:foo}');
        assert.deepEqual(result.rename.classes, {
            foo: 'a',
            bar: 'b'
        });
    });

    for (var name in tests) {
        createRenameTest(name, tests[name]);
    }
});

