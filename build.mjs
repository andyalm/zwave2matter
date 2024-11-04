import * as esbuild from 'esbuild';
import { typecheckPlugin } from '@jgoz/esbuild-plugin-typecheck';

await esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  conditions: ['node'],
  plugins: [typecheckPlugin()],
  outfile: 'dist/zwave2matter.js',
  sourcemap: true,
});
