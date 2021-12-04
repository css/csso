import assert from 'assert';
import { minify } from 'csso';

const css = '.test{color:red;}@media foo{div{color:green}}';

describe('plugins', () => {
    it('calls beforeCompress when it is a function', () => {
        let called = true;
        const ast = minify(css, {
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
        let called = [false, false];
        const pluginFactory = (index) => (ast, options) => {
            assert(ast);
            assert(options);
            called[index] = true;
        };
        const ast = minify(css, {
            beforeCompress: [pluginFactory(0), pluginFactory(1)]
        });

        assert(called[0]);
        assert(called[1]);
        assert(ast);
    });

    it('calls afterCompress when it is a function', () => {
        let called = true;
        const ast = minify(css, {
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
        const pluginFactory = (index) => (compressResult, options) => {
            assert(compressResult);
            assert(compressResult.ast);
            assert(options);
            called[index] = true;
        };
        const ast = minify(css, {
            afterCompress: [pluginFactory(0), pluginFactory(1)]
        });

        assert(called[0]);
        assert(called[1]);
        assert(ast);
    });
});
