import { fileURLToPath } from "node:url";
import { resolve, extname, sep } from "node:path";
import { readFile } from "node:fs/promises";
import { defineConfig } from "../../../web/enhanced/node_modules/vite/dist/node/index.js";

const root = fileURLToPath(new URL(".", import.meta.url));
const source = resolve(root, "../../../web/enhanced");
const repo = resolve(source, "../../../..");
const dist = resolve(source, "dist");

export default defineConfig({
  root,
  esbuild: { jsx: "automatic", jsxImportSource: "react" },
  plugins: [{
    name: "s2-existing-lifecycle-preview",
    configureServer(server) {
      // Serve the existing production player intact. No copied lifecycle renderer/model.
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url || "/", "http://localhost");
        if (!url.pathname.startsWith("/lifecycle/")) return next();
        try {
          const path = resolve(dist, decodeURIComponent(url.pathname.slice(11)) || "index.html");
          if (!path.startsWith(dist + sep)) throw new Error("Outside production preview");
          const data = await readFile(path);
          res.setHeader("Cache-Control", "no-store");
          res.setHeader("Content-Type", ({ ".html": "text/html; charset=utf-8", ".js": "application/javascript", ".css": "text/css", ".svg": "image/svg+xml" })[extname(path)] || "application/octet-stream");
          res.end(data);
        } catch { res.statusCode = 404; res.end("Build the existing enhanced project before opening the lifecycle lens."); }
      });
    },
  }],
  resolve: { alias: {
    "react-dom": resolve(source, "node_modules/react-dom"),
    "react": resolve(source, "node_modules/react"),
  } },
  server: { host: "127.0.0.1", port: 5192, strictPort: true, fs: { allow: [repo] } },
  build: { outDir: resolve(repo, ".visual-qa/der-s2/design-build"), emptyOutDir: false },
});
