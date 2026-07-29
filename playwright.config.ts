import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright config — drives Storybook for visual regression & interaction tests.
 *
 * Snapshots are tightly bounded by `maxDiffPixelRatio: 0.01`. Baselines must be
 * generated on a real Storybook run (CI or local). Do NOT regenerate baselines
 * during scaffolding — they would lock in unverified pixels.
 *
 * Port 6011 is this repo's slot in the estate-wide Storybook port allocation
 * (see .claude/conventions/storybook-a11y-testing.md in the rarebit-one
 * workspace) — every Storybook used to default to 6006, so no two could run at
 * once. It must stay in sync with the `storybook` script in package.json, which
 * `webServer.command` below spawns.
 */
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:6011',
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
    url: 'http://localhost:6011',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
