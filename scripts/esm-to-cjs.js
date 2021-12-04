import fs from 'fs';
import path from 'path';
import { rollup } from 'rollup';

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

function readDir(dir) {
    return fs.readdirSync(dir)
        .filter(fn => fn.endsWith('.js'))
        .map(fn => `${dir}/${fn}`);
}

async function build(outputDir, ...entryPoints) {
    const startTime = Date.now();

    console.log();
    console.log(`Convert ESM to CommonJS (output: ${outputDir})`);

    const res = await rollup({
        external,
        input: entryPoints,
        plugins: [
            replaceContent({
                'lib/version.js': removeCreateRequire
            })
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
    await build('./cjs', 'lib/index.js');
    await build('./cjs-test', ...readDir('test'));
}

buildAll();
