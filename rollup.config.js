import project from "./package.json";
import babel from "rollup-plugin-babel";
import { uglify } from "rollup-plugin-uglify";

function buildBabelConfig() {
  return {
    babelrc: false,
    presets: [
      [
        "env",
        {
          modules: false,
          exclude: ["transform-es2015-typeof-symbol"]
        }
      ]
    ],
    plugins: ["external-helpers"]
  };
}

function buildConfigBuilder({ name, input, dist = "dist" }) {
  return ({
    format,
    transpiled = true,
    minified = false,
    includeExtension = true,
    extension = format,
    sourceMap = false
  }) => {
    function buildFileName() {
      return `${name}${includeExtension ? `.${extension}` : ""}${
        minified ? ".min" : ""
      }.js`;
    }

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
        file: buildFileName(),
        dir: dist,
        sourcemap: sourceMap
      },
      plugins: buildPlugins()
    };
  };
}

const buildConfig = buildConfigBuilder({
  name: project.name,
  input: "./src/v8n.js"
});

const configs = [
  buildConfig({ format: "amd" }),
  buildConfig({ format: "cjs" }),
  buildConfig({ format: "umd" }),
  buildConfig({
    format: "umd",
    minified: true,
    includeExtension: false,
    sourceMap: true
  }),
  buildConfig({ format: "iife", extension: "browser" }),
  buildConfig({
    format: "iife",
    extension: "browser",
    minified: true,
    sourceMap: true
  }),
  buildConfig({ format: "esm" }),
  buildConfig({ format: "system" })
];

export default configs;
