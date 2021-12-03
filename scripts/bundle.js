const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');
const { version } = require('../package.json');

async function build() {
    const genModules = {
        [path.resolve('lib/version.js')]: () => `export const version = "${version}";`
    };
    const genModulesFilter = new RegExp('(' + Object.keys(genModules).join('|').replace(/\./g, '\\.') + ')$');
    const genModuleCache = new Map();
    const genModule = (fn) => {
        if (!genModuleCache.has(fn)) {
            genModuleCache.set(fn, genModules[fn]());
        }

        return genModuleCache.get(fn);
    };
    const plugins = [{
        name: 'replace',
        setup({ onLoad }) {
            onLoad({ filter: genModulesFilter }, args => ({
                contents: genModule(args.path)
            }));
        }
    }];

    await Promise.all([
        esbuild.build({
            entryPoints: ['lib/index.js'],
            outfile: 'dist/csso.js',
            format: 'iife',
            globalName: 'csso',
            bundle: true,
            minify: true,
            logLevel: 'info',
            plugins
        }),

        esbuild.build({
            entryPoints: ['lib/index.js'],
            outfile: 'dist/csso.esm.js',
            format: 'esm',
            bundle: true,
            minify: true,
            logLevel: 'info',
            plugins
        })
    ]);

    for (const [key, value] of genModuleCache) {
        const fn = path.basename(key);
        fs.writeFileSync(`dist/${fn}`, value);
    }
}

build();
