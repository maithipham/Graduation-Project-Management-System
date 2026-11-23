import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env.e2e') });

const studentBaseUrl = process.env.E2E_BASE_URL_STUDENT || 'http://localhost:5174';
const lecturerBaseUrl = process.env.E2E_BASE_URL_LECTURER || 'http://localhost:5173';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  expect: {
    timeout: 15_000,
  },
  globalSetup: './support/global-setup.ts',
  globalTeardown: './support/global-teardown.ts',
  reporter: [['list']],
  use: {
    baseURL: studentBaseUrl,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    viewport: { width: 1440, height: 900 },
  },
  projects: [
    {
      name: 'student',
      testIgnore: /.*\.lecturer\.spec\.ts/,
      use: {
        baseURL: studentBaseUrl,
      },
    },
    {
      name: 'lecturer',
      testMatch: /.*\.lecturer\.spec\.ts/,
      use: {
        baseURL: lecturerBaseUrl,
      },
    },
  ],
});
