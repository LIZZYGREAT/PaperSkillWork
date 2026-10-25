import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';

const dependencies = fileURLToPath(new URL("./node_modules/", import.meta.url));

export default defineConfig({
  plugins: [react(), {
    name: 'kit-registry',
    resolveId(id) { if (id === 'virtual:kit-registry') return '\0kit-registry'; },
    load(id) {
      if (id !== '\0kit-registry') return;
      const path = fileURLToPath(new URL('../registry.yaml', import.meta.url));
      this.addWatchFile(path);
      return `export default ${JSON.stringify(parse(readFileSync(path, 'utf8')).components)};`;
    },
  }],
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: [
      { find: "react/jsx-dev-runtime", replacement: `${dependencies}react/jsx-dev-runtime.js` },
      { find: "react/jsx-runtime", replacement: `${dependencies}react/jsx-runtime.js` },
      { find: "react-dom/client", replacement: `${dependencies}react-dom/client.js` },
      { find: "react-dom", replacement: `${dependencies}react-dom/index.js` },
      { find: "react", replacement: `${dependencies}react/index.js` },
    ],
  },
  build: {
    rollupOptions: {
      input: {
        demo: fileURLToPath(new URL("./index.html", import.meta.url)),
        smoke: fileURLToPath(new URL("./tests.html", import.meta.url)),
      },
    },
  },
});
