import assert from 'assert';
import { minify } from '../csso.esm.js';

it('csso.esm.js', () => {
    const { css: actual } = minify('.test { color: green; color: #ff0000; }');

    assert.strictEqual(actual, '.test{color:red}');
});
