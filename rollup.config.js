import project from './package.json';
import babel from 'rollup-plugin-babel';
import { uglify } from 'rollup-plugin-uglify';

function buildBabelConfig() {
  return {
    babelrc: false,
    presets: [
      [
        'env',
        {
          modules: false,
          exclude: ['transform-es2015-typeof-symbol'],
        },
      ],
    ],
    plugins: ['external-helpers'],
  };
}

function buildConfigBuilder({ name, input, dist = 'dist' }) {
  return ({
    filename,
    format,
    transpiled = true,
    minified = false,
    sourceMap = false,
  }) => {
    function buildPlugins() {
      const plugins = [];
      if (transpiled) plugins.push(babel(buildBabelConfig()));
      if (minified) plugins.push(uglify());
      return plugins;
    }

    return {
      input: input,
      output: {
        name,
        format,
        file: filename,
        dir: dist,
        sourcemap: sourceMap,
      },
      plugins: buildPlugins(),
    };
  };
}

const buildConfig = buildConfigBuilder({
  name: project.name,
  input: './src/v8n.js',
});

const configs = [
  // AMD″
  buildConfig({ filename: 'v8n.amd.js', format: 'amd' }),
  // CJS
  buildConfig({ filename: 'v8n.cjs.js', format: 'cjs' }),
  // UMD
  buildConfig({ filename: 'v8n.umd.js', format: 'umd' }),
  buildConfig({
    filename: 'v8n.min.js',
    format: 'umd',
    minified: true,
    sourceMap: true,
  }),
  // IIFE
  buildConfig({ filename: 'v8n.browser.js', format: 'iife' }),
  buildConfig({
    filename: 'v8n.browser.min.js',
    format: 'iife',
    extension: 'browser',
    minified: true,
    sourceMap: true,
  }),
  // ESM
  buildConfig({ filename: 'v8n.esm.js', format: 'es' }),
  buildConfig({
    filename: 'v8n.esm.browser.js',
    format: 'es',
    extension: 'browser',
    transpiled: false,
  }),
  // System
  buildConfig({ filename: 'v8n.system.js', format: 'system' }),
];

export default configs;
