import project from './package.json';
import buble from '@rollup/plugin-buble';
import { terser } from 'rollup-plugin-terser';

function buildConfig({ dest, format, transpile = true }) {
  // Enforces the '.min.js' naming standard
  const minify = dest.endsWith('.min.js');

  const plugins = [];
  if (transpile) plugins.push(buble());
  if (minify) plugins.push(terser());

  return {
    input: './src/v8n.js',
    output: {
      name: project.name,
      format,
      file: './dist/' + dest,
      sourcemap: minify,
      exports: 'default',
    },
    plugins,
  };
}

const configs = [
  // AMD″
  buildConfig({ dest: 'v8n.amd.js', format: 'amd' }),

  // CJS
  buildConfig({ dest: 'v8n.cjs.js', format: 'cjs' }),

  // UMD
  buildConfig({ dest: 'v8n.umd.js', format: 'umd' }),
  buildConfig({ dest: 'v8n.min.js', format: 'umd' }),

  // IIFE
  buildConfig({ dest: 'v8n.browser.js', format: 'iife' }),
  buildConfig({ dest: 'v8n.browser.min.js', format: 'iife' }),

  // ESM
  buildConfig({ dest: 'v8n.esm.js', format: 'es' }),
  buildConfig({ dest: 'v8n.esm.browser.js', format: 'es', transpile: false }),
  buildConfig({
    dest: 'v8n.esm.browser.min.js',
    format: 'es',
    transpile: false,
  }),

  // System
  buildConfig({ dest: 'v8n.system.js', format: 'system' }),
];

export default configs;
