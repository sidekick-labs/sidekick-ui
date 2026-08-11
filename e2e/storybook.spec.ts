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
 *
 * DIAGNOSING A FAILING CASE — compare the right two things.
 * Regenerate twice and compare the two REGENERATIONS TO EACH OTHER. That, and
 * only that, answers "does this render deterministically?". Comparing a
 * regeneration to the COMMITTED baseline answers a different question — "is the
 * committed baseline current?" — and a stale baseline fails it just as loudly.
 * Reading the second result as the first is what produced the "two cases render
 * non-deterministically" finding in native-experiences-brain#726: both cases
 * were byte-identical across 15 renders, and both baselines were 3.5 months old.
 * `visual-baselines.yml` now runs that self-check for you and fails on it.
 *
 * A stable pixel count across repeated runs (3,839 every time, not 3,800-3,900)
 * is the tell: a flake wobbles, a stale baseline does not.
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
  // Was held back as `test.fixme` on the theory that Radix's portal settled a
  // pixel or two differently between runs. That theory was wrong, and so was
  // the premise under it: this case is not non-deterministic at all.
  //
  // ubuntu-latest renders it byte-identically. Measured 15 times across two
  // separate workflow runs (10 isolated repeats, 3 full-suite runs, and two
  // independent `--update-snapshots` regenerations on a different runner VM):
  // one single sha256 for all 15. The ~3,839px delta was stable to the pixel on
  // every one of them, which is the signature of a WRONG BASELINE, not a flake.
  //
  // What actually differed: the *trigger button*, not the menu. The menu is
  // pixel-identical to its baseline. `variant="outline"` carries
  // `hover:bg-[var(--color-primary)] hover:text-[var(--color-primary-foreground)]`,
  // and after `.click()` the pointer is still resting on the trigger, so the
  // capture is legitimately the hover state — solid lime, black ink. The
  // baseline predates #183 (`modal={false}`); while the menu was still modal,
  // Radix's overlay took the pointer off the trigger and the baseline recorded
  // the un-hovered outline instead. Confirmed directly: after the click
  // `trigger.matches(':hover')` is `true`, and moving the mouse away flips it
  // to `false` with the menu still open.
  //
  // The baseline was therefore 3.5 months stale (last written 2026-04-29),
  // asserting a trigger state the component no longer produces. Regenerated on
  // ubuntu-latest. See sidekick-labs/native-experiences-brain#726.
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
  // The second case held back as `test.fixme` with "cause NOT identified". It
  // is identified now, and it was never non-determinism: same 15-render
  // byte-identical result as the DropdownMenu case above, with the ~1,596px
  // delta stable to the pixel every time.
  //
  // The baseline (also last written 2026-04-29) had FROZEN A DEFECT. Sampling
  // the PNGs: in the baseline the `text-2xl font-bold` stat values render at
  // rgb(10,10,10) on a rgb(10,10,10) card — invisible, black on black. Today
  // they render #ffffff. The fix landed in `Card`, which gained
  // `text-[var(--color-text)]` precisely so "text inside the card (incl.
  // unstyled children) inherits a contrast-safe color instead of falling back
  // to the browser default (black on a dark surface)". `StatCard`'s value has
  // no colour class of its own, so it was exactly that unstyled child.
  // The labels moved too, `--color-text-muted` #737373 -> #a3a3a3 (a WCAG AA
  // fix), which lands under Playwright's default per-pixel threshold.
  //
  // So the "unstable" case was the gate correctly reporting that the committed
  // pixels were the pre-fix, unreadable ones. `ui-statcard--trend-up` renders
  // the same component and never flagged only because ui#191 regenerated ITS
  // baseline while this one kept the April bytes.
  //
  // Regenerated on ubuntu-latest. See sidekick-labs/native-experiences-brain#726.
  test('StatsGrid — Default', async ({ page }) => {
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
