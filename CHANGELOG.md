# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/sidekick-labs/sidekick-ui/compare/v0.5.0...HEAD
[0.5.0]: https://github.com/sidekick-labs/sidekick-ui/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/sidekick-labs/sidekick-ui/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/sidekick-labs/sidekick-ui/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/sidekick-labs/sidekick-ui/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/sidekick-labs/sidekick-ui/releases/tag/v0.1.0
