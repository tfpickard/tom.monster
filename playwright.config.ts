import type { PlaywrightTestConfig } from "@playwright/test";

const config: PlaywrightTestConfig = {
  testDir: "tests/e2e",
  timeout: 120_000,
  use: {
    baseURL: "http://localhost:3000",
  },
};

export default config;
