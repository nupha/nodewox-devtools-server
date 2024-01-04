import { defineConfig } from "vite";

export default defineConfig({
  mode: "development",
  build: {
    target: "modules",
    minify: false,
    lib: {
      entry: {
        dts: "src/index.ts",
      },
      formats: ["cjs"],
      fileName: (fmt, name) => {
        switch (name) {
          case "dts":
            return "devtools-server.js";
          default:
            return `${name}.js`;
        }
      },
    },

    rollupOptions: {
      external: ["nodewox", "http", "fs"],
      output: { dynamicImportInCjs: true },
      treeshake: "smallest",
    },
  },
});
