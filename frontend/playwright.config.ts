import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.E2E_BASE_URL || 'http://localhost:5173';
const parsedUrl = new URL(baseURL);
const devHost = parsedUrl.hostname || '127.0.0.1';
const devPort = parsedUrl.port ? Number(parsedUrl.port) : 5173;

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 300_000, // Increased timeout for slow mode
  expect: { timeout: 10_000 },
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL,
    trace: 'retain-on-failure',
    launchOptions: {
      slowMo: process.env.SLOWMO ? Number(process.env.SLOWMO) : 0,
    },
  },
  webServer: {
    command: `npm run dev -- --host ${devHost} --port ${devPort}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    env: {
      VITE_API_URL: process.env.E2E_API_URL || 'http://localhost:8000',
      VITE_WS_URL: process.env.E2E_WS_URL || 'ws://127.0.0.1:0',
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
