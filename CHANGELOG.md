# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.9.0] - 2026-07-28

### Added

- **CONSUMER-AFFECTING — `--color-primary-text`, the brand lime as _ink_ (#167).** A sibling to the `--color-primary` fill, for text, icons, and the borders that carry a component's state or affordance. Dark theme sets it to `#b7ff31`, identical to the fill, so **the dark theme is byte-for-byte unchanged**. Light theme sets it to `#497000` — the same hue (81°) as the brand lime, darkened until it clears WCAG AA as body text (5.83:1 on `#ffffff`, 5.35:1 on the darkest light surface `#f5f5f5`, 5.69:1 on Callout note's `#f8ffea` tint). The lime **fill** is deliberately untouched: `#b7ff31` is correct as a background (black on it is 10.63:1) and was standardized in 0.8.0 (#155); it simply cannot be a foreground on white, where it measures 1.2:1. Consumers rendering lime text or icons via `var(--color-primary)` should move those uses to `var(--color-primary-text)`; fills, tints, and decorative borders stay on `var(--color-primary)`.

### Fixed

- **CONSUMER-AFFECTING — the light theme now passes the a11y gate: 62 `color-contrast` violation nodes across 24 stories fixed** (sidekick-labs/product-brain#297, #167). `.storybook/preview.tsx` pinned `initialGlobals.theme = 'dark'`, so the light palette had never been audited. Five token-level root causes, all fixed in `theme.css` rather than per story:
  - **34 nodes** — `#b7ff31` as foreground on `#ffffff` / `#f8ffea`, at **1.17–1.20:1**. Fixed by the new `--color-primary-text` ink (see Added), applied in `Button` (`outline`, `link` hover), `Tabs` (active), `Callout` (note title + icon), `List`, `JsonEditor`, `.prose a`, and every `--color-primary` focus ring.
  - **8 nodes** — white on `--color-accent-light` `#0891b2` at 3.68:1 → **`#0e7490`** (5.36:1); `--color-accent-hover-light` `#0e7490` → `#155e75`.
  - **8 nodes** — white on `--color-success-light` `#16a34a` at 3.29:1 → **`#15803d`** (5.02:1); `--color-success-hover-light` `#15803d` → `#166534`.
  - **4 nodes** — white on `--color-warning-light` `#d97706` at 3.18:1 → **`#b45309`** (5.02:1); `--color-warning-hover-light` `#b45309` → `#92400e`.
  - **8 nodes** — the light semantic inks failing by a rounding width on Callout's `bg-[var(--color-*)]/10` tint (4.48–4.49:1 there, though fine on plain white): `--color-info-text-light` `#2563eb` → **`#1d4ed8`**, `--color-success-text-light` `#15803d` → **`#166534`**, `--color-warning-text-light` `#b45309` → **`#92400e`**. `--color-danger-text-light` already cleared at 5.54:1 and is unchanged.

  The **4.5:1** body-text bar was applied to all of these — the affected labels are 12–16px at normal weight, so none qualify for the 3:1 large-text allowance. The 3:1 non-text bar governs only the focus rings and state borders, which the inks clear with room to spare.

  Apps overriding any of these tokens locally, or hard-coding the old hexes, should re-check their own values. Every dark-theme value is unchanged.

### Changed (dev)

- **The a11y gate now audits both themes as well as both widths (#167).** `vitest.config.ts` declares four browser instances — the full 2×2 of {phone 414, desktop 1280} × {dark, light} — with the theme pinned through the same per-instance `provide` channel as the viewport. The reported test count is now **4× the story count**. `testTimeout` raised 120s → 180s to absorb the extra queueing; `maxWorkers` re-measured at four instances and held at 3 (3 workers 20s/20s, 4 workers 20s/32s, 6 workers 21s/25s, uncapped 25s/19s — 3 has the tightest spread, and spread is what becomes CI flake).
- `src/test/viewport-matrix.stories.tsx` → **`src/test/audit-matrix.stories.tsx`**, with a second tripwire story asserting the theme axis. Both now derive their expectation from the Vitest instance name, because a dead theme axis fails _silently_ into a legitimate value (`dark`) — unlike the width axis, which fails into a tell-tale 1200 (#167).

## [0.8.0] - 2026-07-28

### Fixed

- **`PopoverContent` now has an accessible name (`aria-dialog-name`).** Radix renders `PopoverContent` as `role="dialog"`, and unlike `Dialog`/`AlertDialog` it has no title slot — so every popover failed axe's `aria-dialog-name` rule (impact: **serious**). `PopoverContent` now falls back to `aria-label="Popover"` when the caller supplies neither `aria-label` nor `aria-labelledby`; a caller-provided value always wins. Consumers running an axe gate at `error` (sidekick-web, sidekick-harness) no longer fail on library-owned popovers (#160).

### Changed

- **CONSUMER-AFFECTING — brand lime standardized on `#B7FF31` (#155).** The primary color token is now the same lime in both themes, replacing the previous Tailwind lime-500/600 pair:
  - Dark: `--color-primary` `#84cc16` → `#b7ff31`, `--color-primary-hover` `#65a30d` → `#9bd92a`.
  - Light: `--color-primary-light` `#65a30d` → `#b7ff31`, `--color-primary-hover-light` `#4d7c0f` → `#9bd92a`, and `--color-primary-foreground-light` `#ffffff` → `#000000` (the brighter lime needs black foreground text for AA contrast).
  - Anything that renders on `--color-primary` in the light theme will now show **black** text/icons instead of white. Apps overriding these tokens locally should re-check their own values.

### Changed (dev)

- Replaced `@storybook/test-runner` with `@storybook/addon-vitest` for the Storybook render + interaction + a11y gate; the gate now runs under Vitest's browser mode and is a required status check on `main` (#160).
- Dependency maintenance across the prod, dev, and actions groups (#131–#159), including the weekly maintenance sweep (#156). The `typescript` / `vite-plugin-dts` pins that guard the type-declaration rollup (see 0.7.1) remain in place at `^5.9.3` / `^4.5.4`.
- CI hardening: third-party actions SHA-pinned via pinact plus `.pinact.yaml` (#139); npm upgraded to `>=11.5.1` on the publish runner and the publish switched to pure OIDC Trusted Publishing (#133, #134, #135).
- Docs: `CLAUDE.md` harmonized to the workspace skeleton with the Storybook how-to extracted into a skill (#146), and npm Trusted Publishing marked live (#145).

## [0.7.1] - 2026-06-22

### Fixed

- **Restored the type-declaration build.** Reverted `vite-plugin-dts` `^5.0.2` → `^4.5.4` and `typescript` `^6.0.3` → `^5.9.3`. Dependabot #122 over-bumped this toolchain: `vite-plugin-dts@5` (rewritten on `unplugin-dts`) ignores the configured `rollupTypes: true`, and TS 6 is too new for the bundled API Extractor — together they silently emitted an empty `export {}` `dist/index.d.ts`. **v0.7.0 was tagged but never published** because `publish.yml`'s d.ts guard blocked it; 0.7.1 supersedes it and carries all of 0.7.0's changes below.
- **Hardened the publish d.ts guard** (`publish.yml`) so it now fails on an empty `export {}` rollup: it requires real declarations (`declare` / named `export type|interface|…`) and a minimum line count, not just the file existing with some `^export` line.

### Changed (dev)

- chore(deps): block major-version dependabot bumps of `typescript`, `vite-plugin-dts`, and `@microsoft/api-extractor` (`.github/dependabot.yml` `ignore`) so this trap can't return silently. Patch/minor updates still flow.

## [0.7.0] - 2026-06-22

> **Superseded by 0.7.1 — never published.** This version was tagged but its
> publish was blocked by the d.ts guard (empty-types regression from #122; see
> 0.7.1). All changes below shipped in 0.7.1.

### Added

- **Storybook a11y gate.** `@storybook/test-runner` now renders every story (render-smoke) and runs **axe** on each (`.storybook/test-runner.ts`), as a sibling `a11y` job in the E2E workflow alongside the existing Playwright visual-regression suite (#128). Policy: `serious`/`critical` violations **fail CI**; `moderate`/`minor` are logged as advisories. axe runs against the default (dark) theme.
- **Semantic text-color tokens** `--color-info-text`, `--color-success-text`, `--color-warning-text`, `--color-danger-text` (with `*-text-light` variants), tuned for WCAG-AA (≥4.5:1) as colored text/icons on the near-black dark surfaces. `Status`, `Callout`, `StatCard`, `FormField`, `JsonEditor`, and `ModelListItem` render colored text via these (#128).
- Storybook autodocs: registered `@storybook/addon-docs` so the autogenerated **Docs** tab renders, plus a `Foundations/Introduction` MDX landing page documenting the design-token system and how consumers wire up the two package entry points (#127).

### Changed

- **CONSUMER-AFFECTING — design-token contrast fixes (#128).** A single semantic color can no longer serve both as a fill behind white text and as colored text on a dark surface, so fill and text roles are now separate tokens:
  - **Fill tokens darkened** for AA-compliant white `*-foreground` text on badges/buttons: `--color-info` `#3b82f6` → `#2563eb` (and `--color-info-hover` `#2563eb` → `#1d4ed8`); `--color-danger` `#ef4444` → `#dc2626` (and `--color-danger-hover` `#dc2626` → `#b91c1c`). `--color-success`/`--color-warning` fills unchanged.
  - **New `-text` tokens** (see Added) carry the colored-text role: dark theme `--color-info-text: #60a5fa`, `--color-success-text: #22c55e`, `--color-warning-text: #f59e0b`, `--color-danger-text: #f87171`; light theme `--color-info-text-light: #2563eb`, `--color-success-text-light: #15803d`, `--color-warning-text-light: #b45309`, `--color-danger-text-light: #b91c1c`.
  - `--color-text-muted` darkened/lightened for AA body text: `#a3a3a3` (dark) / `#5c5c5c` (light).
  - `Card` now sets an explicit `text-[var(--color-text)]` so card contents no longer inherit the browser-default black on a dark surface.

  Consumers that referenced `--color-info`/`--color-danger` as _text_ colors should switch to the matching `-text` token; the fills now assume white foreground text.

### Fixed

- **Accessibility (serious/critical axe violations) (#128):**
  - Standalone `Checkbox` stories now carry an `aria-label` (`button-name`, critical).
  - `ModelListItem` capability indicator renders as a non-interactive `<span>` when the row itself is `role="button"` (avoiding `nested-interactive`); it stays a focusable `<button>` otherwise.
  - `ChatMessage` streaming cursor is now decorative (`aria-hidden`); streaming is already announced via the bubble's `aria-live`/`aria-busy` (`aria-prohibited-attr`).

### Changed (dev)

- chore(deps-dev): bump `vitest` from `^4.0.18` to `^4.1.9` (resolves the `socket/low-supply-chain-score` advisory on 4.0.18). Aligns with `@vitest/coverage-v8` already at `^4.1.9`.

## [0.6.1] - 2026-04-27

### Fixed

- `dist/index.d.ts` shipped as an empty `export {}` stub in v0.6.0, breaking every TypeScript consumer. Root cause: TypeScript was bumped to 6.0.3 in #49, but `vite-plugin-dts` rolls types up via `@microsoft/api-extractor`, whose bundled compiler is TS 5.8.x. API Extractor logged a "newer than the bundled compiler engine" warning and emitted an empty stub instead of failing the build. Pinned `typescript` back to `^5.9.3` until API Extractor catches up.

## [0.6.0] - 2026-04-27

### Added

- `Time` component, `TimezoneProvider`, and `useTimezone()` hook for consistent date/time rendering (#66)
  - Resolution order: explicit `timezone` prop → `TimezoneProvider` context → browser tz → `"UTC"`
  - Supports `date`, `datetime`, `datetime-tz`, and `relative` format variants
  - Framework-agnostic — no `@inertiajs/react` coupling; consumers wire up their own timezone source
- Storybook stories for `Doctor`, `JsonEditor`, `LayoutShell`, `ModelListItem`, `Sidebar`, `Time`, and business components, completing coverage of the public API (#69)
- Playwright visual regression suite covering all Storybook stories (#67, #69)
- Vitest coverage thresholds enforced in CI (#67)
- `PlatformSwitcher` test suite (#67)

### Changed

- `JsonEditor` validation state consolidated into a single reducer for predictable transitions (#63)
- `Doctor` panel: inline render props extracted; prop state lazy-initialised (#64)

### Fixed

- `ModelListItem` icon is now consistently rendered as a `<button>` for keyboard / screen-reader access (#65) (a11y)
- `JsonEditor` deduplicates Ajv `allErrors` so concurrent errors on the same path no longer collide on React keys (#62)
- List components no longer mix array-index tiebreakers into keys, preventing remount bugs on reorder (#61)
- TypeScript 7.0 compatibility: added CSS module type declaration (#51) and removed deprecated `baseUrl` (#50)
- ESLint 10 compatibility: replaced `eslint-plugin-react` with `@eslint-react` (#48)

### Security

- Hardened all GitHub Actions workflows with pinned versions and minimal permissions (#56)
- Added CodeQL Actions-workflow scanning (#57)

## [0.5.0] - 2026-04-01

### Added

- `PlatformSwitcher` component for consistent sidebar headers across apps (#38)
  - Composes `DropdownMenu` + `Avatar` for cross-app linking and org switching
  - Supports `interactive` prop for static mode (no dropdown)
  - Exports `PlatformSwitcherProps`, `LinkedApp`, `Organisation` types

### Changed

- Bump `lucide-react` from 0.577.0 to 1.7.0 (#37)
- Bump dev-dependencies group with 4 updates (#36)

## [0.4.0] - 2026-03-25

### Added

- `AlertDialog` component wrapping `@radix-ui/react-alert-dialog` for destructive confirmations (#35)

### Changed

- Split CSS: `theme.css` split into `theme.css` (tokens) + `animations.css` (keyframes) + `index.css` (entry point) (#35)

### Removed

- Validation utils (`isValidEmail`, `isValidIpOrCidr`, `useIpValidation`) removed from public API (#35)

### Fixed

- Button link variant: `border-transparent` replaced with `border-0` for correct inline alignment (#35)

## [0.3.0] - 2026-03-25

### Changed

- Upgraded Vite to v8 and `@vitejs/plugin-react` to v6 (#34)
- Bump dev-dependencies group with 8 updates (#30)

### Fixed

- Add permissions to Claude workflow callers (#29)

## [0.2.0] - 2026-03-18

### Added

- `StatCard`, form fields, `DataTable`, `Tabs`, `SectionHeader`, `ProgressBar`, `StatsGrid` components (#28)
- Component tests and extracted remaining UI primitives (#13)

### Changed

- Standardized GitHub Actions workflows (#27)
- Added pre-push prepare hook for auto-rebase and commit count check (#19, #20)
- Added worktree skill for isolated session management (#17)
- Bump `lucide-react` from 0.564.0 to 0.577.0 (#15)

## [0.1.0] - 2026-03-03

### Added

- Initial package scaffold for `@sidekick-labs/ui`
- 19 UI primitives: Accordion, Avatar, Badge, Button, Card, Checkbox, Collapsible, Dialog, DropdownMenu, EmptyState, Label, List, PageHeader, Popover, RadioGroup, Select, Separator, Tabs, Tooltip
- Business components: `ChatMessage`, `ModelListItem` (#12)
- Utilities and hooks: `formatDate`, `formatDateTime`, `formatRelativeTime`, `getLocalTimezone`, `parseJsonError`, `formatJson`, `cn`, `useDebounce` (#9)
- CSS variables-based theme system (#9)
- Storybook for component documentation (#10)
- GitHub Packages publishing as `@sidekick-labs/ui` (#11)
- GitHub Actions CI and publish workflows

[Unreleased]: https://github.com/sidekick-labs/sidekick-ui/compare/v0.9.0...HEAD
[0.9.0]: https://github.com/sidekick-labs/sidekick-ui/compare/v0.8.0...v0.9.0
[0.8.0]: https://github.com/sidekick-labs/sidekick-ui/compare/v0.7.1...v0.8.0
[0.7.1]: https://github.com/sidekick-labs/sidekick-ui/compare/v0.6.1...v0.7.1
[0.7.0]: https://github.com/sidekick-labs/sidekick-ui/compare/v0.6.1...v0.7.0
[0.6.1]: https://github.com/sidekick-labs/sidekick-ui/compare/v0.6.0...v0.6.1
[0.6.0]: https://github.com/sidekick-labs/sidekick-ui/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/sidekick-labs/sidekick-ui/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/sidekick-labs/sidekick-ui/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/sidekick-labs/sidekick-ui/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/sidekick-labs/sidekick-ui/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/sidekick-labs/sidekick-ui/releases/tag/v0.1.0
