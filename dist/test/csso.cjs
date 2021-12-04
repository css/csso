/* global csso */
const assert = require('assert');
const fs = require('fs');

it('csso.js', () => {
    eval(fs.readFileSync('dist/csso.js', 'utf8'));
    const { css: actual } = csso.minify('.test { color: green; color: #ff0000; }');

    assert.strictEqual(actual, '.test{color:red}');
});
