const resolve = require('rollup-plugin-node-resolve');
const json = require('rollup-plugin-json');
const commonjs = require('rollup-plugin-commonjs');

module.exports = {
    input: 'lib/index.js',
    output: {
        file: 'dist/csso-browser.js',
        exports: 'named',
        name: 'csso',
        format: 'umd'
    },
    plugins: [
        resolve({ browser: true }),
        commonjs(),
        json()
    ]
};
