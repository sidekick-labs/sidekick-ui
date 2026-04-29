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
  // Storybook signals render mode via a body class: `sb-show-main` for
  // successfully rendered stories, `sb-show-errordisplay` for runtime errors,
  // and `sb-show-nopreview` for missing/unmatched story ids. Fail fast on the
  // error/no-preview paths so we never silently snapshot the error UI.
  // (NB: `#error-message` always exists in `iframe.html` as a hidden element,
  // so checking for it directly produces false positives.)
  await page.waitForFunction(
    () => {
      const cls = document.body.classList
      return (
        cls.contains('sb-show-main') ||
        cls.contains('sb-show-errordisplay') ||
        cls.contains('sb-show-nopreview')
      )
    },
    null,
    { timeout: 30_000 },
  )
  const errored = await page.evaluate(() => {
    const cls = document.body.classList
    return cls.contains('sb-show-errordisplay') || cls.contains('sb-show-nopreview')
  })
  if (errored) {
    throw new Error(`Storybook reported no matching story for id: ${storyId}`)
  }
}

test.describe('Visual regression — Storybook', () => {
  // --- Interactive: Button (variants matrix) ---
  test('Button — AllVariants', async ({ page }) => {
    await gotoStory(page, 'ui-button--all-variants')
    await expect(page).toHaveScreenshot('button-all-variants.png')
  })

  // --- Feedback: Status (statuses matrix) ---
  test('Status — AllStatuses', async ({ page }) => {
    await gotoStory(page, 'ui-status--all-statuses')
    await expect(page).toHaveScreenshot('status-all-statuses.png')
  })

  // --- Interactive: Dialog (open state via portal) ---
  test('Dialog — Default (open state)', async ({ page }) => {
    await gotoStory(page, 'ui-dialog--default')
    // The Default story renders a trigger button; click it to open the dialog.
    await page.getByRole('button', { name: 'Open Dialog' }).click()
    // Wait for Radix dialog to mount in the portal.
    await page.getByRole('dialog').waitFor()
    await expect(page).toHaveScreenshot('dialog-default-open.png')
  })

  // --- Feedback: Badge (variants matrix) ---
  test('Badge — AllVariants', async ({ page }) => {
    await gotoStory(page, 'ui-badge--all-variants')
    await expect(page).toHaveScreenshot('badge-all-variants.png')
  })

  // --- Feedback: Callout (variants matrix) ---
  test('Callout — AllVariants', async ({ page }) => {
    await gotoStory(page, 'ui-callout--all-variants')
    await expect(page).toHaveScreenshot('callout-all-variants.png')
  })

  // --- Feedback: EmptyState (data-driven empty layout) ---
  test('EmptyState — WithAction', async ({ page }) => {
    await gotoStory(page, 'ui-emptystate--with-action')
    await expect(page).toHaveScreenshot('empty-state-with-action.png')
  })

  // --- Layout: Card (composed layout with footer) ---
  test('Card — WithFooter', async ({ page }) => {
    await gotoStory(page, 'ui-card--with-footer')
    await expect(page).toHaveScreenshot('card-with-footer.png')
  })

  // --- Data: DataTable (default, populated rows) ---
  test('DataTable — Default', async ({ page }) => {
    await gotoStory(page, 'ui-datatable--default')
    await expect(page).toHaveScreenshot('data-table-default.png')
  })

  // --- Data: DataTable (empty state) ---
  test('DataTable — Empty', async ({ page }) => {
    await gotoStory(page, 'ui-datatable--empty')
    await expect(page).toHaveScreenshot('data-table-empty.png')
  })

  // --- Data: Pagination (full variant, mid-list state) ---
  test('Pagination — Default', async ({ page }) => {
    await gotoStory(page, 'ui-pagination--default')
    await expect(page).toHaveScreenshot('pagination-default.png')
  })

  // --- Interactive: Tabs (default selection) ---
  test('Tabs — Default', async ({ page }) => {
    await gotoStory(page, 'ui-tabs--default')
    await expect(page).toHaveScreenshot('tabs-default.png')
  })

  // --- Interactive: DropdownMenu (open state via portal) ---
  test('DropdownMenu — Default (open state)', async ({ page }) => {
    await gotoStory(page, 'ui-dropdownmenu--default')
    await page.getByRole('button', { name: 'Open menu' }).click()
    await page.getByRole('menu').waitFor()
    await expect(page).toHaveScreenshot('dropdown-menu-default-open.png')
  })

  // --- Feedback: ProgressBar (variants matrix) ---
  test('ProgressBar — AllVariants', async ({ page }) => {
    await gotoStory(page, 'ui-progressbar--all-variants')
    await expect(page).toHaveScreenshot('progress-bar-all-variants.png')
  })

  // --- Layout: StatsGrid (composed dashboard widget) ---
  test('StatsGrid — Default', async ({ page }) => {
    await gotoStory(page, 'ui-statsgrid--default')
    await expect(page).toHaveScreenshot('stats-grid-default.png')
  })
})
