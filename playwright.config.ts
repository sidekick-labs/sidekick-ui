import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright config — drives Storybook for visual regression & interaction tests.
 *
 * Baselines must be generated ON LINUX by `.github/workflows/visual-baselines.yml`
 * — a macOS render is a different rasterisation and diffs forever.
 *
 * TOLERANCE. This used to be `maxDiffPixelRatio: 0.01`, described in this
 * comment as "tightly bounded". It was not: the ratio is taken over the WHOLE
 * screenshot, and these are full-page 1280x720 captures (~921k pixels), so it
 * waved through any change touching fewer than ~9,200 pixels — which is most
 * single-component changes. Proven, not assumed: widening the `md` badge
 * padding from `px-2` to `px-3` (a real, visible 4px shift on every badge in
 * the variants matrix) passed this gate green.
 *
 * `maxDiffPixels: 200` instead — absolute, so it does not get looser as a
 * story grows, and near the real noise floor: two independent ubuntu-latest
 * regeneration runs produced BYTE-IDENTICAL PNGs for all 14 pre-existing
 * baselines, so the observed run-to-run noise in this environment is zero. The
 * 200 is a courtesy buffer against occasional font/GPU jitter, not a budget.
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
      maxDiffPixels: 200,
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
