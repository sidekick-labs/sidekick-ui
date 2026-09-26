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

Render-smoke comes free: a story that throws on mount fails its test. `play` functions run too, so interaction stories are genuinely exercised. axe runs against **both themes** — see the matrix below. It used to run only the catalog's shipped default (dark), on the assumption that light-theme contrast was "kept correct in `theme.css`"; it was not, and 62 violations accumulated behind that assumption.

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

Fix the **component/token** (labels, `aria-*`, alt text, button `type`, label/input association, **contrast tokens**, heading order), not the gate. `Card` sets an explicit `text-[var(--color-text)]` so card contents never inherit the browser-default black on a dark surface.

**Contrast: fills and inks are separate tokens, on purpose.** `theme.css` splits every colour that appears in both roles:

- **fill** tokens — `--color-primary`, `--color-info`, `--color-success`, `--color-warning`, `--color-danger` — tuned as _backgrounds_ behind their `*-foreground` text.
- **ink** tokens — `--color-{primary,info,success,warning,danger}-text` — tuned as _foreground_ text, icons, and state borders.

A single value cannot satisfy both directions in both themes, so **never retune a fill to make text pass.** That is doubly true of `--color-primary`: `#b7ff31` is the brand lime, deliberately standardized in v0.8.0 (#155), and it is correct as a fill (black on it is 10.63:1). As text on white it is 1.2:1, and no on-brand darkening of the _fill_ can fix that. The light theme therefore carries `--color-primary-text-light: #497000` — the same hue (81deg), darkened until it clears AA — while the fill stays lime. Dark theme sets `--color-primary-text: #b7ff31`, identical to the fill, so the ink tokens are a no-op there. This is the same accent-ink pattern as `fundbright-web`'s `accent-text`, `luminality-web`'s `--color-*-text` siblings, and `jumpdrive-static`'s `--color-accent-ink`.

**Check which bar applies before changing a token, and say which you applied:**

| bar   | applies to                                                                                  |
| ----- | ------------------------------------------------------------------------------------------- |
| 4.5:1 | body text — anything under 18.66px bold / 24px normal. Badge and Button labels are 12-14px. |
| 3:1   | large text, and non-text UI: icons, focus rings, borders that carry state or affordance.    |

axe's `color-contrast` rule only sees **text**, so the 3:1 non-text cases (focus rings, the outline Button's border, the active Tab underline) are _not_ caught by the gate — they still have to be reasoned about by hand. They use the ink tokens, which clear 4.5:1 and so clear 3:1 with room. Purely decorative brand uses (Callout's tinted container border, Blockquote's rule, ProgressBar, Checkbox fill, chat bubbles) keep the lime fill.

Also measure a semantic ink against the **worst** background it actually renders on, which is usually not white: Callout tints its container with `bg-[var(--color-*)]/10`, and three light inks sat at 4.48-4.49:1 there — failing by a rounding width — while looking fine on `#ffffff`.

## Browser-mode gotchas

- **Tailwind must be mirrored into Storybook's Vite pipeline.** `.storybook/main.ts`'s `viteFinal` adds `@tailwindcss/vite` via `mergeConfig`. Without it stories render unstyled — which both invalidates visual baselines **and** produces bogus `color-contrast` violations.
- **Radix + React must be pre-bundled.** `.storybook/main.ts` sets `optimizeDeps.include` for `react*` and every `@radix-ui/*` package. Without it, portal content mounted mid-`play` lazy-loads a second React copy and crashes with `Cannot read properties of null (reading 'useRef')`.
- **Keep `test` config out of `vite.config.ts`.** Vitest projects and the library build must not share a `test` key (Storybook issue #32444) — all Vitest config lives in `vitest.config.ts`.
- **`testTimeout` is raised to 120s** on the `storybook` project: the first story in each file absorbs that file's browser-side transform time, which routinely blows the 15s default on a cold Vite cache and on CI runners. The stories themselves run in milliseconds. It was 60s until the viewport matrix below doubled the browser contexts competing for a 2-core CI runner — the binding constraint is stories sitting **queued** while their clock runs, so raise this, never trim it.

## Every story is audited at two viewports AND in both themes

`browser.instances` declares **four** Chromium instances — the full 2x2 of {phone, desktop} x {dark, light}:

| instance                  | viewport | theme | what it covers                                                               |
| ------------------------- | -------- | ----- | ---------------------------------------------------------------------------- |
| `storybook-mobile-dark`   | 414x896  | dark  | The collapsed/responsive rendering, below `md:`.                             |
| `storybook-desktop-dark`  | 1280x720 | dark  | Wide DataTable headers, multi-column layouts, full Pagination; clears `xl:`. |
| `storybook-mobile-light`  | 414x896  | light | Both of the above, against the light palette.                                |
| `storybook-desktop-light` | 1280x720 | light |                                                                              |

axe measures the DOM **as rendered**, so a single viewport only ever audits one side of every `md:`/`lg:` breakpoint: whatever the active width hides is not passing, it is _unreachable_. Neither width is a baseline on its own.

**Theme is exactly the same argument, one axis over.** The catalog pins `initialGlobals.theme = 'dark'`, so for as long as the gate ran one theme it audited one theme — and the light palette, which the package equally ships to sidekick-web and sidekick-harness, rotted unseen: **62 `color-contrast` nodes across 24 stories** when it was first measured (sidekick-labs/product-brain#297, fixed in the same PR that added these instances). A theme is not a skin over an already-audited base; every contrast pair is theme-specific, and clearing AA on `#000000` says nothing about `#ffffff`.

The two axes are kept independent — a full 2x2, not a cheaper 3-cell L — because width decides **which** elements exist and theme decides **what colour** they are. A light-theme token used only inside a desktop-only element is audited by exactly one of the four cells.

**This is why the reported test count is 4x the number of stories.** If it ever stops being 4x, an instance silently stopped running — investigate rather than accepting the green. (But see the tripwire below: a correct multiple is _not_ evidence the axes differ.)

Every instance needs an explicit `name`. Unqualified `{ browser: 'chromium' }` entries collide with `project name "storybook (chromium)" already defined` (storybookjs/storybook#32427). The names are also load-bearing beyond uniqueness — the tripwire parses them.

**Reporting rule:** never report this gate as an unqualified "clean". Say which cells passed — "4 of 4 (2 widths x 2 themes)".

### Both axes come from Storybook globals, NOT `browser.instances[].viewport`

**This is the trap, and this repo fell into it.** The matrix originally shipped with a `viewport: { width, height }` on each instance. That key is **inert**, twice over:

1. `@vitest/browser-playwright` 4.1.x has its `options.viewport ??= this.project.config.browser.viewport` line commented out behind a `// TODO: investigate the consequences for Vitest 5`, so `browser.viewport` never reaches the Playwright context.
2. `@storybook/addon-vitest` calls `page.viewport()` itself before every story and, with no Storybook viewport selected, uses its hardcoded 1200x900.

So **both instances rendered at 1200x900** — 336 tests for one width. It type-checked, and the count did double (two instances genuinely execute), which is exactly why it looked right. **A doubled test count is not evidence the widths differ.**

Width and theme are pinned instead by **Storybook globals**, per instance, via `provide` — the viewport value resolved against the `phone` / `desktop` presets in `.storybook/preview.tsx`, the theme against its `theme` globalType:

```ts
{ browser: 'chromium', name: 'storybook-mobile-light',
  provide: { 'storybook/test-initial-globals': { viewport: { value: 'phone' }, theme: 'light' } } }
```

Both halves of the viewport form are required — the `provide` value is a lookup key into `parameters.viewport.options`.

**Keep both globals in ONE object literal.** A per-instance `provide` _replaces_ the plugin's provide object rather than merging into it, so a second `provide` entry silently drops the first.

**A committed tripwire guards both axes:** `src/test/audit-matrix.stories.tsx`. Keep it. These failure modes have no other signal — a dependency bump that changes the provide key, the globals' shape, or `setViewport()`'s precedence collapses every instance back to the defaults while every story still passes at exactly 4x.

Both of its stories cross-check against the **Vitest instance name** (`storybook-{mobile,desktop}-{dark,light}`), which is the one part of the setup a fallback cannot fake. That matters more for theme than for width:

- A dead **width** axis is self-evident — it reports 1200, a value no instance ever asks for.
- A dead **theme** axis is not. Its failure mode is every instance quietly falling back to `initialGlobals.theme = 'dark'`, a perfectly legitimate value. `expect(['dark','light']).toContain(globals.theme)` would pass in exactly the broken state it exists to catch. Hence `expect(globals.theme).toBe(<theme parsed from the instance name>)`.

`AuditsBothThemes` also asserts the **consequence** — the resolved `<body>` background and the resolved `--color-primary-text` — so a theme global that arrives but never reaches the DOM (broken decorator, broken `[data-theme='light']` block) also fails. If either story fails, the matrix is dead: fix the wiring, **do not widen the assertion**.

After any `provide` change, also re-check the **gate** still fires: a temporary story with deliberate `image-alt` + `color-contrast` violations must FAIL in all four instances. Delete that one afterwards.

### The canvas is painted under Vitest only

Several stories are deliberately wider than a phone (DataTable pins `w-[640px]`), so at 414px their right-hand columns overhang the decorator's wrapper and sit on the bare `body` — which this design system never paints, because that is the consuming app's job. axe then measures dark-theme foreground tokens against the browser default **white** and reports contrast failures for tokens that are fine on the real `#000000` canvas. That produced 9 phantom violations the moment a genuinely narrow instance ran.

So when a light-theme violation reports `background color: #ffffff`, **check whether that white is the painted canvas or a phantom** before treating it as a defect: in light theme `--color-background` genuinely _is_ `#ffffff`, so the same reading can be real. (For the 62 violations fixed in the light-theme pass it was real — the dark instances were clean throughout, which a phantom would not have allowed.)

The decorator therefore mirrors the theme onto `<html>` and paints `<body>` — but **only when `__vitest_browser__` is set**. That scoping is load-bearing, not incidental: see below.

**The viewport matrix does not touch visual regression** — that job runs from `playwright.config.ts` via `e2e.yml` against the committed `*-chromium-linux` baselines and shares no Vitest config. **But `.storybook/preview.tsx` is NOT insulated the same way**: `e2e/storybook.spec.ts` takes FULL-PAGE screenshots of the preview iframe, so anything the decorator paints unconditionally _will_ invalidate all 14 baselines. Hence the `__vitest_browser__` guard. Before changing the decorator, check whether the change is visible in a full-page screenshot, and remember **local runs write `*-darwin` files and pass without ever comparing** — only CI's linux run is evidence.
