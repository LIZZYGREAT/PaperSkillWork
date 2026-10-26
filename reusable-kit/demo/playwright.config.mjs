import { defineConfig } from "@playwright/test";

const executablePath = process.env.PAPERWORK_PLAYWRIGHT_EXECUTABLE;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  reporter: "list",
  timeout: 20_000,
  use: {
    baseURL: "http://127.0.0.1:4173",
    browserName: "chromium",
    headless: true,
    viewport: { width: 1440, height: 900 },
    ...(executablePath ? { launchOptions: { executablePath } } : {}),
  },
});
