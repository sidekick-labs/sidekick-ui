# CLAUDE.md

## Worktree-First Workflow (Mandatory)

**All code changes MUST happen in an isolated worktree.** Do not modify files in the main checkout. Before writing any code, create a worktree:

```bash
DEFAULT_BRANCH=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@refs/remotes/origin/@@')
DEFAULT_BRANCH=${DEFAULT_BRANCH:-main}
git fetch origin "$DEFAULT_BRANCH"
git worktree add .worktrees/<name> -b <branch-name> "origin/$DEFAULT_BRANCH"
```

Then work inside `.worktrees/<name>/` for the rest of the session.

**Naming:** Use the Linear issue identifier if available (e.g., `.worktrees/<identifier>`), a task slug (e.g., `.worktrees/fix-auth-timeout`), or today's date (e.g., `.worktrees/2026-04-01`) as fallback.

**The only exceptions** — you may skip worktree creation when:
1. The user explicitly says to skip it (e.g., "no worktree", "just edit here", `--stay`)
2. The task is read-only (research, investigation, code review with no edits)
3. You are already inside a worktree (check: `git rev-parse --git-dir` returns a path under `.git/worktrees/`)
4. You are running in a CI/automated context (GitHub Actions, etc.) where the checkout is already isolated

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

Published to GitHub Packages (`npm.pkg.github.com`) via the `publish.yml` GitHub Actions workflow. Version is managed manually in `package.json`. A GitHub Release triggers the publish.