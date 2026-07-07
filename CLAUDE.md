# CLAUDE.md

Guidance for Claude Code working with the sidekick-ui shared component library.

## Overview

`@sidekick-labs/ui` is a React 19 component library (design system) built with TypeScript, Radix UI primitives, and Tailwind CSS v4. It is published to npm as a scoped public package and consumed by both sidekick-web (Rails + Inertia.js) and sidekick-harness (Fastify + Inertia.js).

## Commands

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

## Architecture

**Stack:** React 19, TypeScript, Vite (library mode), Tailwind CSS 4, Radix UI.

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

**Build output:** `dist/` contains the ESM bundle (`index.js`), type declarations (`index.d.ts`), and compiled CSS (`styles/index.css`).

**Package exports:**

- `@sidekick-labs/ui` — components, hooks, and utilities
- `@sidekick-labs/ui/styles` — compiled Tailwind CSS theme

**Consumers:** sidekick-web (Rails + Inertia.js), sidekick-harness (Fastify + Inertia.js).

## Conventions

- **No default exports** — components use named exports only.
- **Radix UI wrappers** — interactive components wrap Radix primitives with styled variants.
- **CSS variables** — theming uses CSS custom properties (`var(--color-*)`, `var(--radius-*)`).
- **`cn()` utility** — all className merging uses `cn()` from `src/lib/utils.ts`.
- **Peer dependencies** — React 19, React-DOM 19 (consumers provide these).
- **Dependencies** — Radix UI, clsx, tailwind-merge, lucide-react (externalized in build; bundled by consumers).

Applicable workspace conventions (see `.claude/conventions/`):

- **`storybook-frontend-only-catalog.md`** — UI primitives (`Components/*`) live **only** here in `@sidekick-labs/ui`; this repo owns the shared components and the estate's visual-regression baselines. See the `storybook` skill.
- **`claude-md-shape.md`** — the skeleton this file follows.

## Constraints

1. **No app-specific code** — components must be generic and reusable across sidekick-web and sidekick-harness.
2. **No Inertia.js dependency** — this package must not depend on `@inertiajs/react` or any routing library.
3. **No side effects besides CSS** — the `sideEffects` field in `package.json` only allows CSS.
4. **Serialization-free** — components accept plain props, never API response objects directly.
5. **Pre-push validation is non-negotiable** — `pre-push-lint.sh` runs Prettier, ESLint, tsc, and Vitest before push (skipped automatically in CI). If it fails, fix the underlying issue. Avoid `SKIP_PRE_PUSH_HOOK=1` unless there is a genuine emergency — and even then, fix the root cause before the next push. A broken push here ships a broken `@sidekick-labs/ui` release that simultaneously breaks sidekick-web AND sidekick-harness builds.
6. **Pre-PR verification — sweep before declaring done.** Before marking a component change complete:
   - **Consumer impact sweep:** for breaking changes to a component's props, exported types, or CSS class names, `rg` for the symbol across BOTH consuming repos (`../sidekick-web/app/frontend/` and `../sidekick-harness/src/frontend/` — these paths assume a sibling checkout layout under the workspace root). If a consumer references it, either keep the API backward-compatible OR bump the major version in `package.json` AND open paired PRs in the consumers.
   - **Type export sweep:** if you added a new exported type or component, confirm it's re-exported from `src/index.ts` — types not in the barrel are invisible to consumers even if the component bundle includes them. A prior incident: `.d.ts` publish broke because barrel was incomplete.
   - **Theme/token sweep:** if you added a new CSS variable in `src/styles/theme.css`, verify both dark and light themes define it; a missing `--color-foo` falls back to `unset` and renders invisibly.
   - **Build sanity:** run `npm run build` locally before push — `dist/` is gitignored, so CI is the first place a broken Vite library build would surface otherwise. Inspect `dist/index.d.ts` to confirm types compiled (look for `export declare` lines for your new component).
   - **Vitest sweep:** `rg` the renamed/changed identifier in `src/**/*.test.{ts,tsx}` and update fixtures and assertion strings.

## Storybook

Storybook is the component catalog and the home of the library's two automated UI gates — Playwright visual regression and the axe a11y gate. Full how-to (run/build, the a11y policy, per-story scope-disable, fixing contrast/token violations) lives in the **`storybook` skill** (`.claude/skills/storybook/`).

Decision rule: `.claude/conventions/storybook-frontend-only-catalog.md`.

## Publishing

Published to npm (`registry.npmjs.org`) as a public package via the `publish.yml` GitHub Actions workflow. Version is managed manually in `package.json`. A GitHub Release triggers the publish.

The publish job runs in the `npm` GitHub Environment (deployment-branch-policy: `main` branch + `v*` tags). npm Trusted Publishing is configured on the npmjs.com side (publisher: GitHub Actions, repo: `sidekick-ui`, workflow: `publish.yml`, environment: `npm`), so the OIDC `id-token: write` permission lets CI publish without any token (requires npm ≥ 11.5.1 on the runner). `secrets.NPM_TOKEN` remains only as a fallback.

## Workspace rules

> Worktree-only workflow, signed commits, the /ship→/land→/release lifecycle,
> Claude effort-tiering, the pre-push auto-rebase/squash prepare hook, and
> LEFTHOOK are workspace-wide — see the workspace-root CLAUDE.md, and note the
> worktree + signing rules are hook-enforced. Do not re-document them here.
