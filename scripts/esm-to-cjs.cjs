// This script is written using CommonJS since it should run
// on Node.js versions which don't support for ESM

const fs = require('fs');
const path = require('path');
const { rollup } = require('rollup');

const { name: packageName } = require('../package.json');

const external = [
    'module',
    'fs',
    'path',
    'url',
    'assert',
    'json-to-ast',
    'css-tree',
    'csso',
    /^source-map/
];

function removeCreateRequire(id) {
    return fs.readFileSync(id, 'utf8')
        .replace(/import .+ from 'module';/, '')
        .replace(/const require = .+;/, '');
}

function replaceContent(map) {
    return {
        name: 'file-content-replacement',
        load(id) {
            const key = path.relative('', id);

            if (map.hasOwnProperty(key)) {
                return map[key](id);
            }
        }
    };
}

function patchTests() {
    // If Node.js doesn't support for `exports` it doesn't support for import/require
    // by package name inside the package itself, so this resolving will fail.
    // We can't use just `require(packageName)` here since CJS modules are not generated yet,
    // and Node.js will fail on resolving it either disregarding of `exports` support.
    // In this case we need to replace import/require using a package name with
    // a relative path to a module.
    try {
        require(`${packageName}/package.json`);
        return;
    } catch (e) {}

    const pathToIndex = path.resolve(__dirname, '../cjs/index.cjs');

    // Make replacement for relative path only for tests since we need to check everything
    // is work on old Node.js version. The rest of code should be unchanged since will run
    // on any Node.js version.
    console.log(`Fixing CommonJS tests by replacing "${packageName}" for a relative paths`);

    return {
        name: 'cjs-tests-fix',
        resolveId(source) {
            if (/^..\/cjs/.test(source)) {
                return { id: source, external: true };
            }
            return null;
        },
        transform(code, id) {
            return code.replace(
                new RegExp(`from (['"])${packageName}\\1;`, 'g'),
                `from '${path.relative(path.dirname(id), pathToIndex)}'`
            );
        }
    };
}

function readDir(dir) {
    return fs.readdirSync(dir)
        .filter(fn => fn.endsWith('.js'))
        .map(fn => `${dir}/${fn}`);
}

async function build(outputDir, patch, ...entryPoints) {
    const startTime = Date.now();

    console.log();
    console.log(`Convert ESM to CommonJS (output: ${outputDir})`);

    const res = await rollup({
        external,
        input: entryPoints,
        plugins: [
            replaceContent({
                'lib/version.js': removeCreateRequire
            }),
            patch && patchTests()
        ]
    });
    await res.write({
        dir: outputDir,
        entryFileNames: '[name].cjs',
        format: 'cjs',
        exports: 'auto',
        preserveModules: true,
        interop: false,
        esModule: false,
        generatedCode: {
            constBindings: true
        }
    });
    await res.close();

    console.log(`Done in ${Date.now() - startTime}ms`);
}

async function buildAll() {
    await build('./cjs', false, 'lib/index.js');
    await build('./cjs-test', true, ...readDir('test'));
}

buildAll();
