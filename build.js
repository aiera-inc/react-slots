import * as esbuild from 'esbuild';

const result = await esbuild.build({
  entryPoints: ['react-slots.tsx'],
  outfile: 'dist/react-slots.js',
  bundle: false,
  sourcemap: false,
  minify: true,
  metafile: true,
});

console.log(await esbuild.analyzeMetafile(result.metafile, { verbose: false }));
