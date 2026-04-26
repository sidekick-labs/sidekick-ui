import { test, expect } from '@playwright/test'

/**
 * Visual regression tests against Storybook's preview iframe.
 *
 * Story IDs are derived from each story's `title` (lowercased, slashes/spaces
 * to dashes) plus the export name. e.g. `title: 'UI/Button'` + `AllVariants`
 * export => `ui-button--all-variants`.
 *
 * Baselines must be generated against a real Storybook run with
 * `npx playwright test --update-snapshots`. Do not commit baselines without
 * verifying the visual output.
 */

const STORY_LOAD_SELECTOR = '#storybook-root *'

async function gotoStory(page: import('@playwright/test').Page, storyId: string) {
  await page.goto(`/iframe.html?id=${storyId}&viewMode=story`)
  // Wait for Storybook to render the story root with at least one child.
  await page.waitForSelector(STORY_LOAD_SELECTOR, { state: 'attached' })
  // Fail fast if Storybook rendered its "Story not found" UI — otherwise we'd
  // silently capture a screenshot of the error page as the baseline.
  const notFound = await page.$('#error-message, .sb-nopreview, [data-test-id="sb-loaderError"]')
  if (notFound) {
    throw new Error(`Storybook reported no matching story for id: ${storyId}`)
  }
}

test.describe('Visual regression — Storybook', () => {
  test('Button — AllVariants', async ({ page }) => {
    await gotoStory(page, 'ui-button--all-variants')
    await expect(page).toHaveScreenshot('button-all-variants.png')
  })

  test('Status — AllStatuses', async ({ page }) => {
    await gotoStory(page, 'ui-status--all-statuses')
    await expect(page).toHaveScreenshot('status-all-statuses.png')
  })

  test('Dialog — Default (open state)', async ({ page }) => {
    await gotoStory(page, 'ui-dialog--default')
    // The Default story renders a trigger button; click it to open the dialog.
    await page.getByRole('button', { name: 'Open Dialog' }).click()
    // Wait for Radix dialog to mount in the portal.
    await page.getByRole('dialog').waitFor()
    await expect(page).toHaveScreenshot('dialog-default-open.png')
  })
})
