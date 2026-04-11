import * as esbuild from 'esbuild';

const shared = {
  bundle: true,
  sourcemap: false,
  minify: true,
  external: ['react', 'react-dom'],
  format: 'esm',
};

const result = await esbuild.build({
  ...shared,
  entryPoints: ['react-slots.tsx'],
  outfile: 'dist/react-slots.js',
  metafile: true,
});

const serverResult = await esbuild.build({
  ...shared,
  entryPoints: ['react-slots-server.tsx'],
  outfile: 'dist/react-slots-server.js',
  metafile: true,
});

console.log('Client:');
console.log(await esbuild.analyzeMetafile(result.metafile, { verbose: false }));
console.log('Server:');
console.log(await esbuild.analyzeMetafile(serverResult.metafile, { verbose: false }));
