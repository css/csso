var assert = require('assert');
var csso = require('../lib/index.js');
var css = '.test{color:red;}@media foo{div{color:green}}';

describe('plugins', function() {
    it('calls afterParse when it is a function', function() {
        var called = true;
        var ast = csso.minify(css, {
            afterParse: function (ast, options) {
                assert(ast);
                assert(options);
                called = true;
            }
        });

        assert(called);
        assert(ast);
    });

    it('calls afterParse when it is an array', function() {
        var called = [false, false];
        var pluginFactory = function (index) {
            return function callback(ast, options) {
                assert(ast);
                assert(options);
                called[index] = true;
            };
        };
        var ast = csso.minify(css, {
            afterParse: [pluginFactory(0), pluginFactory(1)]
        });

        assert(called[0]);
        assert(called[1]);
        assert(ast);
    });

    it('calls afterCompress when it is a function', function() {
        var called = true;
        var ast = csso.minify(css, {
            afterCompress: function (compressResult, options) {
                assert(compressResult);
                assert(compressResult.ast);
                assert(options);
                called = true;
            }
        });

        assert(called);
        assert(ast);
    });

    it('calls afterCompress when it is an array', function() {
        var called = [false, false];
        var pluginFactory = function (index) {
            return function callback(compressResult, options) {
                assert(compressResult);
                assert(compressResult.ast);
                assert(options);
                called[index] = true;
            };
        };
        var ast = csso.minify(css, {
            afterCompress: [pluginFactory(0), pluginFactory(1)]
        });

        assert(called[0]);
        assert(called[1]);
        assert(ast);
    });
});
