import { writeFileSync } from 'fs';
import { resolve, basename } from 'path';
import esbuild from 'esbuild';
import { createRequire } from 'module';

const { version } = createRequire(import.meta.url)('../package.json');

async function build() {
    const genModules = {
        [resolve('lib/version.js')]: `export const version = "${version}";`,
        [resolve('cjs/version.cjs')]: `module.exports = "${version}";`
    };
    const genModulesFilter = new RegExp('(' + Object.keys(genModules).join('|').replace(/\./g, '\\.') + ')$');
    const plugins = [{
        name: 'replace',
        setup({ onLoad }) {
            onLoad({ filter: genModulesFilter }, args => ({
                contents: genModules[args.path]
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

    for (const [key, value] of Object.entries(genModules)) {
        const fn = basename(key);

        writeFileSync(`dist/${fn}`, value);
    }
}

build();
