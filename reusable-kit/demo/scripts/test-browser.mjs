import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

const baseUrl = "http://127.0.0.1:4173";
const server = spawn(process.execPath, [
  "./node_modules/vite/bin/vite.js", "preview", "--configLoader", "runner",
  "--host", "127.0.0.1", "--port", "4173", "--strictPort",
], { stdio: "inherit" });
const serverExited = new Promise((resolve) => server.once("exit", (code) => resolve(code ?? 1)));
let result = 1;

try {
  let ready = false;
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) throw new Error(`Demo preview server exited with code ${server.exitCode}.`);
    try {
      const response = await fetch(`${baseUrl}/tests.html`);
      if (response.ok) { ready = true; break; }
    } catch { /* Server is still starting. */ }
    await delay(150);
  }
  if (!ready) throw new Error("Demo preview did not start. Run `npm run build` before the browser smoke test.");

  const runner = spawn(process.execPath, [
    "./node_modules/@playwright/test/cli.js", "test", "--config=playwright.config.mjs", ...process.argv.slice(2),
  ], { stdio: "inherit" });
  result = await new Promise((resolve, reject) => {
    runner.once("error", reject);
    runner.once("exit", (code) => resolve(code ?? 1));
  });
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
} finally {
  server.kill();
  await Promise.race([serverExited, delay(3000)]);
}

process.exitCode = result;
