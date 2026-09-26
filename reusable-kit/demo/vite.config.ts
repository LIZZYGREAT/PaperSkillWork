import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

const dependencies = fileURLToPath(new URL("./node_modules/", import.meta.url));

export default defineConfig({
  plugins: [react()],
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
