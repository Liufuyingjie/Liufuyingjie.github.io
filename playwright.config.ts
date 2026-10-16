import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/browser", timeout: 30000, fullyParallel: false,
  use: { baseURL: "http://localhost:3000", headless: true },
  reporter: "list",
});
