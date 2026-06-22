# CLAUDE.md

## Worktree-Only Workflow (Enforced)

**All file modifications are blocked in the main checkout.** A PreToolUse hook (`enforce-worktree.sh`) rejects Edit, Write, and NotebookEdit operations targeting files outside a worktree. There are no opt-outs. Do not use Bash to write files in the main checkout either (e.g., `echo >`, `sed -i`, `tee`, `cp`) — the hook cannot intercept shell commands, so this rule is instruction-enforced.

Before writing any code, create a worktree:

```bash
DEFAULT_BRANCH=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@refs/remotes/origin/@@')
DEFAULT_BRANCH=${DEFAULT_BRANCH:-main}
git fetch origin "$DEFAULT_BRANCH"
git worktree add .worktrees/<name> -b <branch-name> "origin/$DEFAULT_BRANCH"
```

Then work inside `.worktrees/<name>/` for the rest of the session.

**Naming:** Use a task slug (e.g., `.worktrees/fix-auth-timeout`) or today's date (e.g., `.worktrees/2026-04-01`). If the work tracks an issue in the owning team-brain repo, you may use that issue number (e.g., `.worktrees/brain-42`).

**The hook allows modifications only when:**

1. The file is inside a git worktree (detected via `git rev-parse --git-dir` returning a path under `.git/worktrees/`)
2. Running in a CI/automated context where the checkout is already isolated

**Why this matters:** Working directly on the main checkout causes cross-contamination between sessions — uncommitted changes, wrong branches, and dirty state leak into unrelated work. Worktrees eliminate this entirely.

See the `/worktree` and `/start` skills for full conventions and flags.

Guidance for Claude Code working with the sidekick-ui shared component library.

## Overview

`@sidekick-labs/ui` is a React 19 component library (design system) built with TypeScript, Radix UI primitives, and Tailwind CSS v4. It is published to GitHub Packages as a scoped npm package and consumed by both sidekick-web and sidekick-harness.

## Quick Reference

```bash
# Development
npm run build                    # Vite library build (ESM + types)
npm run check                    # TypeScript type check

# Testing
npm test                         # Vitest (watch mode)
npm run test:run                 # Vitest (single run)
npm run test:coverage            # Vitest with v8 coverage
npm run test:e2e                 # Playwright visual regression (auto-spawns Storybook)
npm run build-storybook          # Build static Storybook (prereq for the a11y gate)
npm run test-storybook:ci        # Storybook render-smoke + axe a11y gate (serves storybook-static)
npm run test-storybook           # Same gate against an already-running Storybook (e.g. localhost:6006)

# Formatting & Linting
npm run format:check             # Prettier check
npm run format                   # Prettier auto-format
npm run lint                     # ESLint
npm run lint:fix                 # ESLint with auto-fix
```

## Project Structure

```
src/
├── components/
│   ├── ui/              # Base UI components (Button, Card, Dialog, etc.)
│   ├── layouts/         # Layout components
│   └── business/        # Shared business components
├── hooks/               # Shared React hooks
├── lib/
│   └── utils.ts         # cn() utility (clsx + tailwind-merge)
├── styles/
│   └── theme.css        # CSS custom properties (design tokens, dark/light theme)
├── types/               # Shared TypeScript types
├── test/
│   └── setup.ts         # Vitest setup (jest-dom matchers)
└── index.ts             # Package entry point (barrel export)
```

## Architecture

**Stack:** React 19, TypeScript, Vite (library mode), Tailwind CSS 4, Radix UI

**Build output:** `dist/` contains ESM bundle (`index.js`), type declarations (`index.d.ts`), and compiled CSS (`styles/index.css`).

**Package exports:**

- `@sidekick-labs/ui` — components, hooks, and utilities
- `@sidekick-labs/ui/styles` — compiled Tailwind CSS theme

**Consumers:** sidekick-web (Rails + Inertia.js), sidekick-harness (Fastify + Inertia.js)

## Key Conventions

- **No default exports** — components use named exports only
- **Radix UI wrappers** — interactive components wrap Radix primitives with styled variants
- **CSS variables** — theming uses CSS custom properties (`var(--color-*)`, `var(--radius-*)`)
- **`cn()` utility** — all className merging uses `cn()` from `src/lib/utils.ts`
- **Peer dependencies** — React 19, React-DOM 19 (consumers provide these)
- **Dependencies** — Radix UI, clsx, tailwind-merge, lucide-react (bundled with the package's consumers, externalized in build)

## Key Constraints

1. **No app-specific code** — components must be generic and reusable across sidekick-web and sidekick-harness
2. **No Inertia.js dependency** — this package must not depend on `@inertiajs/react` or any routing library
3. **No side effects besides CSS** — the `sideEffects` field in package.json only allows CSS
4. **Serialization-free** — components accept plain props, never API response objects directly

5. **Pre-push validation is non-negotiable** — `pre-push-lint.sh` runs Prettier, ESLint, tsc, and Vitest before push. If it fails, fix the underlying issue. Avoid `SKIP_PRE_PUSH_HOOK=1` unless there is a genuine emergency — and even then, fix the root cause before the next push. A broken push here ships a broken `@sidekick-labs/ui` release that simultaneously breaks sidekick-web AND sidekick-harness builds.

6. **Pre-PR verification — sweep before declaring done.** Before marking a component change complete:
   - **Consumer impact sweep:** for breaking changes to a component's props, exported types, or CSS class names, `rg` for the symbol across BOTH consuming repos (`../sidekick-web/app/frontend/` and `../sidekick-harness/src/frontend/` — these paths assume a sibling checkout layout under the workspace root). If a consumer references it, either keep the API backward-compatible OR bump the major version in `package.json` AND open paired PRs in the consumers.
   - **Type export sweep:** if you added a new exported type or component, confirm it's re-exported from `src/index.ts` — types not in the barrel are invisible to consumers even if the component bundle includes them. A prior incident: `.d.ts` publish broke because barrel was incomplete.
   - **Theme/token sweep:** if you added a new CSS variable in `src/styles/theme.css`, verify both dark and light themes define it; a missing `--color-foo` falls back to `unset` and renders invisibly.
   - **Build sanity:** run `npm run build` locally before push — `dist/` is gitignored, so CI is the first place a broken Vite library build would surface otherwise. Inspect `dist/index.d.ts` to confirm types compiled (look for `export declare` lines for your new component).
   - **Vitest sweep:** `rg` the renamed/changed identifier in `src/**/*.test.{ts,tsx}` and update fixtures and assertion strings.

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

## Claude Code Hooks

### Signed Commits Hook

All `git commit` commands are automatically signed with the `-S` flag.

**To skip** (emergency only):

```bash
SKIP_SIGNED_COMMITS_HOOK=1 git commit -m "message"
```

### Pre-Push Prepare Hook

Automatically keeps feature branches up-to-date before push or PR creation:

1. **Auto-rebase** — Fetches the latest default branch and rebases the current branch onto it. If history changes, `--force-with-lease` is automatically injected into `git push` commands.
2. **Commit count check** — If the branch has more than 1 commit ahead of the default branch, the push is blocked with a suggestion to squash. Claude will ask whether to squash or proceed.

**Triggers on:** `git push` and `gh pr create` commands.

**Skipped when:** on the default branch, in detached HEAD, or in CI environments.

**To skip entirely** (emergency only):

```bash
SKIP_PRE_PUSH_PREPARE=1 git push
```

**To allow multiple commits:**

```bash
ALLOW_MULTIPLE_COMMITS=1 git push
```

### Pre-Push Lint Hook

A Claude Code hook runs before `git push` to catch issues locally:

1. `npm run format:check` — Prettier formatting
2. `npm run lint` — ESLint
3. `npm run check` — TypeScript type checking
4. `npm run test:run` — Vitest tests

**If checks fail**, the push is blocked. Fix the issues and try again.

**To skip** (emergency only):

```bash
SKIP_PRE_PUSH_HOOK=1 git push
```

Note: All hooks are automatically skipped in CI environments.

## Publishing

Published to npm (`registry.npmjs.org`) as a public package via the `publish.yml` GitHub Actions workflow. Version is managed manually in `package.json`. A GitHub Release triggers the publish.

The publish job runs in the `npm` GitHub Environment (deployment-branch-policy: `main` branch + `v*` tags). It uses `secrets.NPM_TOKEN` as a fallback, but once npm Trusted Publishing is configured on the npmjs.com side (publisher: GitHub Actions, repo: `sidekick-ui`, workflow: `publish.yml`, environment: `npm`), the OIDC `id-token: write` permission lets CI publish without any token at all.
