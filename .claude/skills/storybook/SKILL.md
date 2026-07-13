---
name: storybook
description: How to work with the sidekick-ui Storybook component catalog and its two automated UI gates — visual regression (Playwright pixel-diff) and the axe accessibility (a11y) gate. sidekick-ui is the home of the shared UI components and the estate's visual-regression baselines. Invoke when working on Storybook, adding a story, the a11y gate, per-story scope-disable, or fixing contrast/token violations. Triggers: storybook, add a story, a11y, visual regression.
---

## Storybook & CI

Storybook is the component catalog and the home of the library's two automated UI gates. Both run in the **E2E Tests** workflow (`.github/workflows/e2e.yml`) as independent sibling jobs against a Chromium build of the catalog:

1. **Visual regression** (`e2e` job, `e2e/storybook.spec.ts`) — Playwright pixel-diffs a curated set of stories against committed baselines (`maxDiffPixelRatio: 0.01`). Baselines live in `e2e/storybook.spec.ts-snapshots/`; regenerate only on a verified Storybook run (`npx playwright test --update-snapshots`), never during scaffolding.
2. **Accessibility (a11y) gate** (`a11y` job) — `@storybook/test-runner` renders **every** story and runs **axe** on each. Config: `.storybook/test-runner.ts`.

These are separate concerns — do not fold one into the other, and changing a11y tokens may shift visual baselines (regenerate them deliberately if so).

### The a11y gate (policy)

`.storybook/test-runner.ts`'s `postVisit` hook runs axe on `#storybook-root` for each story and **filters by impact**:

- **`serious` / `critical` → FAIL CI** — the hook throws a readable report (rule, help URL, affected nodes).
- **`moderate` / `minor` → logged via `console.warn`, do NOT fail** — visible in CI logs as advisory.

Render-smoke is the test-runner's default per-story behavior (a story that throws on render fails). There are **no hand-written `play()` a11y functions** in this round beyond what already exists for interaction stories; render-smoke + axe is the contract. axe runs against the **default (dark) theme** (the catalog's shipped default); light-theme contrast is kept correct in `theme.css` but is not separately gated.

Run it locally:

```bash
npm run build-storybook        # produces storybook-static/
npm run test-storybook:ci      # serves it on :6006, waits, runs the gate
```

(`storybook-static/` is gitignored and excluded from ESLint/Prettier; if you build locally, lint still passes.)

### Per-story scope-disable (use sparingly)

When a violation is a genuine false positive or an unavoidable third-party/portal case, narrow or disable the scan for **that one story** via `parameters.a11y`, **with a justifying comment** — never a blanket suppression:

```ts
export const SomeStory: Story = {
  parameters: {
    a11y: {
      // why this is a false positive / unavoidable, in one or two lines
      config: { rules: [{ id: 'aria-hidden-focus', enabled: false }] }, // disable ONE rule
      // or: disable: true  // skip the gate entirely for this story
      // or: element: '.my-scope'  // scan a narrower element than #storybook-root
    },
  },
}
```

The current sole exception: `UI/DropdownMenu › OpenInteraction` disables `aria-hidden-focus` (a known Radix false positive while the menu's FocusScope traps focus and aria-hides the page).

### Fixing real violations

For `serious`/`critical` hits, fix the **component/token** (labels, `aria-*`, alt text, button `type`, label/input association, **contrast tokens**, heading order), not the gate. Contrast note: `theme.css` separates **fill** tokens (`--color-info`/`--color-danger`/… — tuned as backgrounds behind white `*-foreground` text) from **text** tokens (`--color-{info,success,warning,danger}-text` — tuned as colored text/icons on the near-black surfaces). A single semantic color can't satisfy both directions; render colored _text_ via the `-text` variants. `Card` sets an explicit `text-[var(--color-text)]` so card contents never inherit the browser-default black on a dark surface.
