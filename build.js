import * as esbuild from 'esbuild';
import esbuildPluginTsc from 'esbuild-plugin-tsc';

const result = await esbuild.build({
  entryPoints: ['react-slots.tsx'],
  outfile: 'dist/react-slots.js',
  bundle: false,
  sourcemap: true,
  plugins: [esbuildPluginTsc({ force: true })],
  minify: true,
  metafile: true,
});

console.log(await esbuild.analyzeMetafile(result.metafile, { verbose: false }));
