import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  retries: 0,
  use: {
    baseURL: 'http://127.0.0.1:4199',
    viewport: { width: 1280, height: 800 },
  },
  webServer: {
    command: 'npx vite preview --port 4199 --host 127.0.0.1',
    url: 'http://127.0.0.1:4199',
    reuseExistingServer: false,
  },
});
