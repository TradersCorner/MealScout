import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./playwright",
  timeout: 60_000,
  retries: 0,
  use: {
    baseURL: process.env.FRONTEND_URL ?? "http://localhost:5174",
    headless: true,
    trace: "retain-on-failure",
  },
});
