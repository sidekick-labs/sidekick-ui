---
name: storybook
description: How to work with the sidekick-ui Storybook component catalog and its two automated UI gates — visual regression (Playwright pixel-diff) and the story-test gate (render + interaction + axe a11y, via @storybook/addon-vitest). sidekick-ui is the home of the shared UI components and the estate's visual-regression baselines. Invoke when working on Storybook, adding a story, the a11y gate, per-story scope-disable, or fixing contrast/token violations. Triggers: storybook, add a story, a11y, visual regression.
---

## Storybook & CI

Storybook is the component catalog and the home of the library's two automated UI gates. Both run as independent jobs against headless Chromium, but they live in **different workflows on purpose**:

1. **Visual regression** (`e2e` job in **E2E Tests**, `.github/workflows/e2e.yml`, `e2e/storybook.spec.ts`) — Playwright pixel-diffs a curated set of stories against committed baselines (`maxDiffPixelRatio: 0.01`). Baselines live in `e2e/storybook.spec.ts-snapshots/`; regenerate only on a verified Storybook run (`npx playwright test --update-snapshots`), never during scaffolding. This job spawns Storybook via `playwright.config.ts`'s `webServer` block and is **entirely separate** from the story-test gate below — it still uses `@playwright/test`.
2. **Story tests / a11y gate** (`a11y` job in **CI**, `.github/workflows/ci.yml`) — **`@storybook/addon-vitest`** turns **every** story into a Vitest **browser-mode** test: it mounts the story, runs its `play` function if it has one, and runs **axe** via `@storybook/addon-a11y`. Config lives in `vitest.config.ts` (the `storybook` project) and `.storybook/preview.tsx` (`parameters.a11y`).

These are separate concerns — do not fold one into the other, and changing a11y tokens may shift visual baselines (regenerate them deliberately if so).

> **Why the a11y job lives in `ci.yml`, not `e2e.yml`:** it is a **required status check** on `main`, and `e2e.yml` is workflow-level path-filtered. A workflow that never triggers never reports its check at all, so GitHub leaves the required context pending forever and any PR touching only `.github/**` or docs becomes unmergeable. `ci.yml`'s `pull_request` trigger is unfiltered, so the job always runs and always reports. **Do not move it back**, and do not rename it — the `name:` must stay byte-identical to the required-check context `Storybook story tests (render + interaction + a11y)`. The `e2e` visual-regression job is expensive and deliberately stays path-filtered (it is not a required check).

> **Migration note (2026-07):** this gate previously used `@storybook/test-runner` + `axe-playwright` with a hand-written `.storybook/test-runner.ts` `postVisit` hook. `@storybook/test-runner` is deprecated; `addon-vitest` is the supported replacement. Both that file and the `@storybook/test-runner` / `axe-playwright` / `concurrently` / `http-server` / `wait-on` dev-dependencies are gone.

## Vitest project layout

`vitest.config.ts` declares two `test.projects`:

| Project     | Env                                | Contents                                                                                             | Script                                            |
| ----------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| `unit`      | jsdom                              | `src/**/*.{test,spec}.{ts,tsx}` — unit tests + the `vitest-axe` jsdom a11y tests in `src/test/a11y/` | `npm run test:run` (also `test`, `test:coverage`) |
| `storybook` | Playwright Chromium (browser mode) | every `*.stories.tsx`                                                                                | `npm run test:storybook`                          |

The coverage config (including the **path-scoped** `src/components/**` and `src/hooks/**` thresholds) lives at the top-level `test.coverage` and is measured against the `unit` project only — `npm run test:coverage` is scoped with `--project=unit`.

`npm test` / `npm run test:run` deliberately run **only** the `unit` project, so the pre-push hook (`.claude/hooks/pre-push-lint.sh`) and the `ci.yml` / `publish.yml` test steps stay jsdom-only and fast. The browser gate runs in its own CI job.

Run the gate locally:

```bash
npm run test:storybook        # Vitest spawns Storybook itself — no build/serve needed
```

## The a11y gate (policy)

`.storybook/preview.tsx` sets, at the preview level:

```ts
parameters: {
  a11y: { test: 'error' },
}
```

**`'error'` fails the run on ANY axe violation, at any impact.** This is stricter than the old test-runner hook, which failed only on `serious`/`critical` and `console.warn`'d `moderate`/`minor`. **addon-vitest has no impact tiering** — `'error'` is all-or-nothing (the alternatives are `'todo'`, which reports without failing, and `'off'`). Accepting the stricter bar was the deliberate tradeoff of the migration; the catalog was clean at 168/168 stories when it was made.

Render-smoke comes free: a story that throws on mount fails its test. `play` functions run too, so interaction stories are genuinely exercised. axe runs against the **default (dark) theme** (the catalog's shipped default, set via `initialGlobals.theme`); light-theme contrast is kept correct in `theme.css` but is not separately gated.

### Portals are now in scope — this is a real behaviour change

The old hook scanned `#storybook-root` only. Radix overlay content (Popover, Dialog, DropdownMenu, Tooltip, Select, AlertDialog) renders in a **portal appended to `document.body`**, i.e. **outside** that element — so the old gate structurally could not see any of it, and portal violations passed silently for as long as the gate existed. addon-a11y scans the whole document, so opened overlays are now covered. The migration surfaced exactly one such violation (`aria-dialog-name` on the unlabelled Radix `PopoverContent`, impact `serious`), fixed at source in `src/components/ui/popover.tsx`.

Consequence: **`parameters.a11y.element` is no longer honoured** (it was a test-runner-only knob). No story used it, so nothing was lost — but don't reach for it.

### Per-story scope-disable (use sparingly)

When a violation is a genuine false positive or an unavoidable third-party/portal case, narrow or disable the scan for **that one story** via `parameters.a11y`, **with a justifying comment** — never a blanket suppression:

```ts
export const SomeStory: Story = {
  parameters: {
    a11y: {
      // why this is a false positive / unavoidable, in one or two lines
      config: { rules: [{ id: 'aria-hidden-focus', enabled: false }] }, // disable ONE rule
      // or: test: 'todo'  // report but don't fail, for THIS story only
      // or: test: 'off'   // skip the a11y check entirely for this story
    },
  },
}
```

`config` (raw axe config) works exactly as before. The old `disable: true` is superseded by `test: 'off'`.

The current sole exception: `UI/DropdownMenu › OpenInteraction` disables `aria-hidden-focus` (a known Radix false positive while the menu's FocusScope traps focus and aria-hides the page).

### Fixing real violations

Fix the **component/token** (labels, `aria-*`, alt text, button `type`, label/input association, **contrast tokens**, heading order), not the gate. Contrast note: `theme.css` separates **fill** tokens (`--color-info`/`--color-danger`/… — tuned as backgrounds behind white `*-foreground` text) from **text** tokens (`--color-{info,success,warning,danger}-text` — tuned as colored text/icons on the near-black surfaces). A single semantic color can't satisfy both directions; render colored _text_ via the `-text` variants. `Card` sets an explicit `text-[var(--color-text)]` so card contents never inherit the browser-default black on a dark surface.

## Browser-mode gotchas

- **Tailwind must be mirrored into Storybook's Vite pipeline.** `.storybook/main.ts`'s `viteFinal` adds `@tailwindcss/vite` via `mergeConfig`. Without it stories render unstyled — which both invalidates visual baselines **and** produces bogus `color-contrast` violations.
- **Radix + React must be pre-bundled.** `.storybook/main.ts` sets `optimizeDeps.include` for `react*` and every `@radix-ui/*` package. Without it, portal content mounted mid-`play` lazy-loads a second React copy and crashes with `Cannot read properties of null (reading 'useRef')`.
- **Keep `test` config out of `vite.config.ts`.** Vitest projects and the library build must not share a `test` key (Storybook issue #32444) — all Vitest config lives in `vitest.config.ts`.
- **`testTimeout` is raised to 120s** on the `storybook` project: the first story in each file absorbs that file's browser-side transform time, which routinely blows the 15s default on a cold Vite cache and on CI runners. The stories themselves run in milliseconds. It was 60s until the viewport matrix below doubled the browser contexts competing for a 2-core CI runner — the binding constraint is stories sitting **queued** while their clock runs, so raise this, never trim it.

## Every story is audited at two viewports

`browser.instances` declares **two** Chromium instances:

| instance            | viewport | what it covers                                                               |
| ------------------- | -------- | ---------------------------------------------------------------------------- |
| `storybook-mobile`  | 414x896  | The collapsed/responsive rendering, below `md:`.                             |
| `storybook-desktop` | 1280x720 | Wide DataTable headers, multi-column layouts, full Pagination; clears `xl:`. |

axe measures the DOM **as rendered**, so a single viewport only ever audits one side of every `md:`/`lg:` breakpoint: whatever the active width hides is not passing, it is _unreachable_. Neither width is a baseline on its own.

**This is why the reported test count is 2x the number of stories.** If it ever stops being 2x, an instance silently stopped running — investigate rather than accepting the green.

Both instances need an explicit `name`. Two unqualified `{ browser: 'chromium' }` entries collide with `project name "storybook (chromium)" already defined` (storybookjs/storybook#32427).

### The width comes from a Storybook global, NOT `browser.instances[].viewport`

**This is the trap, and this repo fell into it.** The matrix originally shipped with a `viewport: { width, height }` on each instance. That key is **inert**, twice over:

1. `@vitest/browser-playwright` 4.1.x has its `options.viewport ??= this.project.config.browser.viewport` line commented out behind a `// TODO: investigate the consequences for Vitest 5`, so `browser.viewport` never reaches the Playwright context.
2. `@storybook/addon-vitest` calls `page.viewport()` itself before every story and, with no Storybook viewport selected, uses its hardcoded 1200x900.

So **both instances rendered at 1200x900** — 336 tests for one width. It type-checked, and the count did double (two instances genuinely execute), which is exactly why it looked right. **A doubled test count is not evidence the widths differ.**

The width is pinned instead by Storybook's viewport global, per instance, via `provide`, resolved against the `phone` / `desktop` presets in `.storybook/preview.tsx`:

```ts
{ browser: 'chromium', name: 'storybook-mobile',
  provide: { 'storybook/test-initial-globals': { viewport: { value: 'phone' } } } }
```

Both halves are required — the `provide` value is a lookup key into `parameters.viewport.options`.

**A committed tripwire guards it:** `src/test/viewport-matrix.stories.tsx` asserts `expect([414, 1280]).toContain(window.innerWidth)`. Keep it. This failure mode has no other signal — a dependency bump that changes the provide key or `setViewport()`'s precedence collapses both instances to 1200x900 while every story still passes at exactly 2x. If it fails reporting 1200, the matrix is dead: fix the wiring, **do not widen the assertion**.

Because a per-instance `provide` _replaces_ the plugin's own provide object rather than merging, also re-check the **gate** still fires after any `provide` change: a temporary story with deliberate `image-alt` + `color-contrast` violations must FAIL in both instances. Delete that one afterwards.

### The canvas is painted under Vitest only

Several stories are deliberately wider than a phone (DataTable pins `w-[640px]`), so at 414px their right-hand columns overhang the decorator's wrapper and sit on the bare `body` — which this design system never paints, because that is the consuming app's job. axe then measures dark-theme foreground tokens against the browser default **white** and reports contrast failures for tokens that are fine on the real `#000000` canvas. That produced 9 phantom violations the moment a genuinely narrow instance ran.

The decorator therefore mirrors the theme onto `<html>` and paints `<body>` — but **only when `__vitest_browser__` is set**. That scoping is load-bearing, not incidental: see below.

**The viewport matrix does not touch visual regression** — that job runs from `playwright.config.ts` via `e2e.yml` against the committed `*-chromium-linux` baselines and shares no Vitest config. **But `.storybook/preview.tsx` is NOT insulated the same way**: `e2e/storybook.spec.ts` takes FULL-PAGE screenshots of the preview iframe, so anything the decorator paints unconditionally _will_ invalidate all 14 baselines. Hence the `__vitest_browser__` guard. Before changing the decorator, check whether the change is visible in a full-page screenshot, and remember **local runs write `*-darwin` files and pass without ever comparing** — only CI's linux run is evidence.
