import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright config — drives Storybook for visual regression & interaction tests.
 *
 * Snapshots are tightly bounded by `maxDiffPixelRatio: 0.01`. Baselines must be
 * generated on a real Storybook run (CI or local). Do NOT regenerate baselines
 * during scaffolding — they would lock in unverified pixels.
 */
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:6006',
    trace: 'on-first-retry',
  },
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run storybook -- --ci',
    url: 'http://localhost:6006',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
