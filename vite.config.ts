import path from "path";
import { readFileSync } from "fs";
import { builtinModules } from "module";
import { defineConfig } from "vitest/config";

const VERSION = readFileSync(path.resolve(__dirname, "VERSION"), "utf8").trim();

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, "src/cli/index.ts"),
      formats: ["cjs"],
      fileName: () => "index.js",
    },

    outDir: path.resolve(__dirname, "dist"),
    rollupOptions: {
      external: [
        "commander",
        "consola",
        "dotenv",
        "figlet",
        ...builtinModules,
        ...builtinModules.map((m) => `node:${m}`),
      ],

      output: {
        banner: "#!/usr/bin/env node",
      },
    },

    minify: false,
    target: "node24",
  },

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },

  define: {
    "__VERSION__": JSON.stringify(VERSION),
  },

  test: {
    include: ["tests/**/*.test.ts"],
  },
});