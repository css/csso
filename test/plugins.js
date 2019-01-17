const assert = require('assert');
const csso = require('../lib');

const css = '.test{color:red;}@media foo{div{color:green}}';

describe('plugins', () => {
    it('calls beforeCompress when it is a function', () => {
        let called = true;
        const ast = csso.minify(css, {
            beforeCompress(ast, options) {
                assert(ast);
                assert(options);
                called = true;
            }
        });

        assert(called);
        assert(ast);
    });

    it('calls beforeCompress when it is an array', () => {
        const called = [false, false];
        const pluginFactory = index => {
            return function callback(ast, options) {
                assert(ast);
                assert(options);
                called[index] = true;
            };
        };

        const ast = csso.minify(css, {
            beforeCompress: [pluginFactory(0), pluginFactory(1)]
        });

        assert(called[0]);
        assert(called[1]);
        assert(ast);
    });

    it('calls afterCompress when it is a function', () => {
        let called = true;
        const ast = csso.minify(css, {
            afterCompress(compressResult, options) {
                assert(compressResult);
                assert(compressResult.ast);
                assert(options);
                called = true;
            }
        });

        assert(called);
        assert(ast);
    });

    it('calls afterCompress when it is an array', () => {
        const called = [false, false];
        const pluginFactory = index => {
            return function callback(compressResult, options) {
                assert(compressResult);
                assert(compressResult.ast);
                assert(options);
                called[index] = true;
            };
        };

        const ast = csso.minify(css, {
            afterCompress: [pluginFactory(0), pluginFactory(1)]
        });

        assert(called[0]);
        assert(called[1]);
        assert(ast);
    });
});
