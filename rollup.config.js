import project from './package.json';
import buble from '@rollup/plugin-buble';
import { terser } from 'rollup-plugin-terser';

function buildConfig({ filename, format, transpile = true }) {
  // Enforces the '.min.js' naming standard
  const minify = filename.endsWith('.min.js');

  const plugins = [];
  if (transpile) plugins.push(buble());
  if (minify) plugins.push(terser());

  return {
    input: './src/v8n.js',
    output: {
      name: project.name,
      format,
      file: './dist/' + filename,
      sourcemap: minify,
      exports: 'default',
    },
    plugins,
  };
}

const configs = [
  // AMD″
  buildConfig({ filename: 'v8n.amd.js', format: 'amd' }),

  // CJS
  buildConfig({ filename: 'v8n.cjs.js', format: 'cjs' }),

  // UMD
  buildConfig({ filename: 'v8n.umd.js', format: 'umd' }),
  buildConfig({ filename: 'v8n.min.js', format: 'umd' }),

  // IIFE
  buildConfig({ filename: 'v8n.browser.js', format: 'iife' }),
  buildConfig({ filename: 'v8n.browser.min.js', format: 'iife' }),

  // ESM
  buildConfig({ filename: 'v8n.esm.js', format: 'es' }),
  buildConfig({
    filename: 'v8n.esm.browser.js',
    format: 'es',
    transpile: false,
  }),
  buildConfig({
    filename: 'v8n.esm.browser.min.js',
    format: 'es',
    transpile: false,
  }),

  // System
  buildConfig({ filename: 'v8n.system.js', format: 'system' }),
];

export default configs;
