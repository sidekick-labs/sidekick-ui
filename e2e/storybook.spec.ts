import { test, expect } from '@playwright/test'

/**
 * Visual regression tests against Storybook's preview iframe.
 *
 * Story IDs are derived from each story's `title` (lowercased, slashes/spaces
 * to dashes) plus the export name. e.g. `title: 'UI/Button'` + `AllVariants`
 * export => `ui-button--all-variants`.
 *
 * Baselines must be generated ON LINUX, by the `Visual Baselines` workflow
 * (`.github/workflows/visual-baselines.yml`) — download its artifact, eyeball
 * every PNG, then commit. A macOS `--update-snapshots` run writes `*-darwin`
 * files that CI never compares against, and a macOS-rendered PNG committed as
 * the `*-chromium-linux` baseline diffs forever on font hinting alone.
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
  // NOT STABLE — held back rather than pinned to a lie. Regenerating every
  // baseline twice on ubuntu-latest, same commit, same workflow, produced
  // byte-identical PNGs for 32 of 34 cases; this was one of the two that did
  // not. It reproduces a ~3,839px delta run to run.
  //
  // Almost certainly the Radix portal: the menu carries `data-[state=open]`
  // zoom-in-95 / slide-in-from-top-2 entrance classes and is positioned by
  // Floating UI, so it can settle a pixel or two off between runs — and a
  // whole menu shifted by 1px is a large diff area.
  //
  // Worth noting what this cost before: under the previous
  // `maxDiffPixelRatio: 0.01` (≈9,216px on a 1280x720 capture) this case
  // "passed" every run while rendering different pixels each time. The
  // baseline asserted nothing, and looked green doing it.
  //
  // `fixme` rather than a silent skip so it stays visible in the report.
  // Fix by screenshotting the menu element instead of the full page, or by
  // waiting for the animation to settle. See sidekick-labs/native-experiences-brain#726.
  test.fixme('DropdownMenu — Default (open state)', async ({ page }) => {
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
  // NOT STABLE — the second of the two, ~1,596px run to run under the same
  // double-regeneration check described above. Unlike the DropdownMenu case
  // the cause is NOT identified: the component declares no animation or
  // transition, and the story feeds it fixed data. Held back rather than
  // guessed at. See sidekick-labs/native-experiences-brain#726.
  test.fixme('StatsGrid — Default', async ({ page }) => {
    await gotoStory(page, 'ui-statsgrid--default')
    await expect(page).toHaveScreenshot('stats-grid-default.png')
  })

  // ---------------------------------------------------------------------------
  // Coverage completion: one baseline per remaining exported component.
  //
  // Every story chosen below is DETERMINISTIC — no `new Date()`-relative
  // output, no random data, no mid-animation frame. `UI/Time` is snapshotted at
  // `DateTime` (a hard-coded instant) rather than `Relative`, whose rendering
  // changes with wall-clock time and would flake nightly.
  // ---------------------------------------------------------------------------

  // --- Disclosure: Accordion (one panel expanded on mount) ---
  test('Accordion — DefaultOpen', async ({ page }) => {
    await gotoStory(page, 'ui-accordion--default-open')
    await expect(page).toHaveScreenshot('accordion-default-open.png')
  })

  // --- Interactive: AlertDialog (open state via portal) ---
  test('AlertDialog — Default (open state)', async ({ page }) => {
    await gotoStory(page, 'ui-alertdialog--default')
    await page.getByRole('button', { name: 'Delete account' }).click()
    await page.getByRole('alertdialog').waitFor()
    await expect(page).toHaveScreenshot('alert-dialog-default-open.png')
  })

  // --- Identity: Avatar (size matrix) ---
  test('Avatar — Sizes', async ({ page }) => {
    await gotoStory(page, 'ui-avatar--sizes')
    await expect(page).toHaveScreenshot('avatar-sizes.png')
  })

  // --- Typography: Blockquote (fullest composition) ---
  test('Blockquote — WithAuthorAndSource', async ({ page }) => {
    await gotoStory(page, 'ui-blockquote--with-author-and-source')
    await expect(page).toHaveScreenshot('blockquote-with-author-and-source.png')
  })

  // --- Navigation: Breadcrumb (separators + truncation at depth) ---
  test('Breadcrumb — DeepHierarchy', async ({ page }) => {
    await gotoStory(page, 'ui-breadcrumb--deep-hierarchy')
    await expect(page).toHaveScreenshot('breadcrumb-deep-hierarchy.png')
  })

  // --- Form: Checkbox (states matrix) ---
  test('Checkbox — States', async ({ page }) => {
    await gotoStory(page, 'ui-checkbox--states')
    await expect(page).toHaveScreenshot('checkbox-states.png')
  })

  // --- Form: FormField (error styling — the highest-signal state) ---
  test('FormField — WithError', async ({ page }) => {
    await gotoStory(page, 'ui-formfield--with-error')
    await expect(page).toHaveScreenshot('form-field-with-error.png')
  })

  // --- Form: JsonEditor (populated editor chrome) ---
  test('JsonEditor — Default', async ({ page }) => {
    await gotoStory(page, 'ui-jsoneditor--default')
    await expect(page).toHaveScreenshot('json-editor-default.png')
  })

  // --- Data: List (sectioned variant) ---
  test('List — WithSections', async ({ page }) => {
    await gotoStory(page, 'ui-list--with-sections')
    await expect(page).toHaveScreenshot('list-with-sections.png')
  })

  // --- Layout: PageHeader (title + breadcrumbs + actions together) ---
  test('PageHeader — FullExample', async ({ page }) => {
    await gotoStory(page, 'ui-pageheader--full-example')
    await expect(page).toHaveScreenshot('page-header-full-example.png')
  })

  // --- Navigation: PlatformSwitcher ---
  test('PlatformSwitcher — Default', async ({ page }) => {
    await gotoStory(page, 'ui-platformswitcher--default')
    await expect(page).toHaveScreenshot('platform-switcher-default.png')
  })

  // --- Interactive: Popover (open state via portal) ---
  test('Popover — Default (open state)', async ({ page }) => {
    await gotoStory(page, 'ui-popover--default')
    await page.getByRole('button', { name: 'Open popover' }).click()
    await page.getByRole('dialog').waitFor()
    await expect(page).toHaveScreenshot('popover-default-open.png')
  })

  // --- Layout: SectionHeader (with trailing actions) ---
  test('SectionHeader — WithActions', async ({ page }) => {
    await gotoStory(page, 'ui-sectionheader--with-actions')
    await expect(page).toHaveScreenshot('section-header-with-actions.png')
  })

  // --- Layout: Separator (horizontal rule + label spacing) ---
  test('Separator — Horizontal', async ({ page }) => {
    await gotoStory(page, 'ui-separator--horizontal')
    await expect(page).toHaveScreenshot('separator-horizontal.png')
  })

  // --- Interactive: SortableList (drag handles at rest) ---
  test('SortableList — Default', async ({ page }) => {
    await gotoStory(page, 'ui-sortablelist--default')
    await expect(page).toHaveScreenshot('sortable-list-default.png')
  })

  // --- Data: StatCard (trend affordance) ---
  test('StatCard — TrendUp', async ({ page }) => {
    await gotoStory(page, 'ui-statcard--trend-up')
    await expect(page).toHaveScreenshot('stat-card-trend-up.png')
  })

  // --- Data: Time (fixed instant — NOT the relative story) ---
  test('Time — DateTime', async ({ page }) => {
    await gotoStory(page, 'ui-time--date-time')
    await expect(page).toHaveScreenshot('time-date-time.png')
  })

  // --- Interactive: Tooltip (open state via portal) ---
  test('Tooltip — Default (open state)', async ({ page }) => {
    await gotoStory(page, 'ui-tooltip--default')
    await page.getByRole('button', { name: 'Hover me' }).hover()
    await page.getByRole('tooltip').first().waitFor()
    await expect(page).toHaveScreenshot('tooltip-default-open.png')
  })

  // --- Business: ChatMessage (assistant bubble at rest) ---
  //
  // Deliberately NOT `Conversation`: its last turn sets `isStreaming`, which
  // renders an `animate-pulse` cursor that never settles. A screenshot of an
  // infinite animation is a coin flip, and this suite runs nightly.
  test('ChatMessage — Default', async ({ page }) => {
    await gotoStory(page, 'business-chatmessage--default')
    await expect(page).toHaveScreenshot('chat-message-default.png')
  })

  // --- Business: ModelListItem (list composition) ---
  test('ModelListItem — ListOfModels', async ({ page }) => {
    await gotoStory(page, 'business-modellistitem--list-of-models')
    await expect(page).toHaveScreenshot('model-list-item-list-of-models.png')
  })
})
