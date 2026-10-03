import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "tests/browser",
  testMatch: process.env.TEST_NO_BACKEND ? "unconfigured.spec.js" : "panel.spec.js",
  timeout: 30000,
  fullyParallel: false,
  use: {
    baseURL: "http://127.0.0.1:5173",
    headless: true,
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
      : {},
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev -- --port 5173 --host 127.0.0.1",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: false,
    env: {
      VITE_SUPABASE_URL: process.env.TEST_NO_BACKEND ? "" : "https://dsc-test.supabase.co",
      VITE_SUPABASE_PUBLISHABLE_KEY: process.env.TEST_NO_BACKEND ? "" : "test-public-key-not-a-real-credential",
      VITE_SUPABASE_ANON_KEY: "",
    },
  },
});
