import { build, Plugin } from 'esbuild';
import path from 'path';

function prebuild(pluginNames: string[]): Plugin {
    return {
        name: 'prebuild-plugin',
        setup(build) {
            build.onResolve({ filter: /:entry:$/ }, args => {
                if (/:initial:$/.test(args.importer)) {
                    return { path: path.join(args.resolveDir, ':entry:') }
                } else {
                    return { path: path.join(args.resolveDir, args.path) }
                }
            })

            build.onLoad({ filter: /:entry:$/ }, () => {
                const contents = pluginNames
                    .map((x, i) => `import p${i} from './${x}'`)
                    .join('\n');

                return { contents }
            })
        }
    }
}

async function run() {
    const bundled = await build({
        stdin: {
            sourcefile: ':initial:',
            contents: `import ':entry:'`,
            resolveDir: 'resolve'
        },
        absWorkingDir: process.cwd(),
        tsconfig: 'tsconfig.json',
        target: 'esnext',
        format: 'esm',
        bundle: true,
        outdir: '.',
        treeShaking: true,
        minify: true,
        write: false,
        plugins: [
            prebuild(['test1', 'hello']),
        ]
    })
    const decoder = new TextDecoder();
    const result = decoder.decode(bundled.outputFiles?.[0].contents);
    console.log(result);
}

run();
