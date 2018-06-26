import project from "./package.json";
import babel from "rollup-plugin-babel";
import { uglify } from "rollup-plugin-uglify";

function buildBabelConfig() {
  return {
    babelrc: false,
    presets: [["env", { modules: false }]]
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
        exports: "named",
        sourcemap: sourceMap
      },
      plugins: buildPlugins()
    };
  };
}

const buildConfig = buildConfigBuilder({ name: "v8n", input: "./src/v8n.js" });

const configs = [
  buildConfig({ format: "amd" }),
  buildConfig({ format: "amd", minified: true }),
  buildConfig({ format: "umd" }),
  buildConfig({ format: "umd", minified: true }),
  buildConfig({ format: "umd", minified: true, includeExtension: false }),
  buildConfig({ format: "iife", extension: "browser" }),
  buildConfig({ format: "iife", extension: "browser", minified: true }),
  buildConfig({ format: "esm", transpiled: false }),
  buildConfig({ format: "system", transpiled: false })
];

export default configs;
