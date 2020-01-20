const path = require('path');
const resolve = require('@rollup/plugin-node-resolve');
const json = require('@rollup/plugin-json');
const commonjs = require('@rollup/plugin-commonjs');

module.exports = {
    input: 'lib/index.js',
    output: {
        file: 'dist/csso.js',
        exports: 'named',
        name: 'csso',
        format: 'umd'
    },
    plugins: [
        resolve({ browser: true }),
        commonjs(),
        json(),
        {
            name: 'version',
            load(id) {
                if (id === path.resolve('package.json')) {
                    return '{ "version": "' + require('./package.json').version + '" }';
                }
            }
        }
    ]
};
