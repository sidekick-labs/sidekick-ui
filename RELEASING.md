# Releasing

This document describes the release process for `@sidekick-labs/ui`.

## Overview

Releases follow a **tag-driven** workflow:

```
Release PR (version bump + changelog) → merge → push tag → release.yml creates GitHub Release → publish.yml publishes to npm
```

Two GitHub Actions workflows chain together:

- **release.yml** — triggered by `v*` tag push; validates version, extracts changelog, creates GitHub Release
- **publish.yml** — triggered by GitHub Release creation; builds, tests, publishes npm package

## Versioning

This project follows [Semantic Versioning](https://semver.org/):

- **Major** (1.0.0) — breaking changes to component APIs or exports
- **Minor** (0.X.0) — new components, features, or non-breaking enhancements
- **Patch** (0.0.X) — bug fixes, style corrections, dependency updates

## Step-by-step

### 1. Prepare the release

Create a release branch and update the version and changelog:

```bash
git checkout main && git pull
git checkout -b chore/release-vX.Y.Z
```

Update `package.json` version:

```bash
npm version X.Y.Z --no-git-tag-version
```

Update `CHANGELOG.md`:

- Move items from `[Unreleased]` into a new `## [X.Y.Z] - YYYY-MM-DD` section
- Categorize entries under: Added, Changed, Fixed, Deprecated, Removed, Security

### 2. Open a release PR

```bash
git add package.json package-lock.json CHANGELOG.md
git commit -m "chore: release vX.Y.Z"
git push -u origin chore/release-vX.Y.Z
gh pr create --title "chore: release vX.Y.Z" --body "Release vX.Y.Z"
```

Wait for CI to pass, then merge.

### 3. Tag and push

After the release PR is merged:

```bash
git checkout main && git pull
git tag -s vX.Y.Z -m "vX.Y.Z"
git push origin vX.Y.Z
```

This triggers the automation:

1. `release.yml` validates the tag matches `package.json`, extracts the changelog section, and creates a GitHub Release
2. The GitHub Release creation triggers `publish.yml`, which builds and publishes to npm (`registry.npmjs.org`)

### 4. Verify

- Check the [Actions tab](https://github.com/sidekick-labs/sidekick-ui/actions) for both workflow runs
- Confirm the [GitHub Release](https://github.com/sidekick-labs/sidekick-ui/releases) has the correct changelog body
- Verify the package is available: `npm view @sidekick-labs/ui@X.Y.Z`

## How publishing is wired

Published to npm (`registry.npmjs.org`) as a public package via the `publish.yml` GitHub Actions workflow. Version is managed manually in `package.json`.

The chain is: **push a `v*` tag → `release.yml` creates the GitHub Release → the `release: published` event triggers `publish.yml` → npm.**

For that chain to hold, `release.yml` must create the Release with a **GitHub App installation token**, not `secrets.GITHUB_TOKEN` — GitHub deliberately suppresses workflow triggers for events created by `GITHUB_TOKEN`. `release.yml` mints one from the `sidekick-labs-bot` App via `actions/create-github-app-token` (`vars.SIDEKICK_RELEASE_BOT_APP_ID` + `secrets.SIDEKICK_RELEASE_BOT_PRIVATE_KEY`, both org-level). If you ever change that token back, auto-publish silently stops — the tag and the Release still appear, only npm goes stale. That is exactly what happened to v0.7.1 and v0.8.0, which both had to be published by a manual `workflow_dispatch`.

The publish job runs in the `npm` GitHub Environment (deployment-branch-policy: `main` branch + `v*` tags). npm Trusted Publishing is configured on the npmjs.com side (publisher: GitHub Actions, repo: `sidekick-ui`, workflow: `publish.yml`, environment: `npm`), so the OIDC `id-token: write` permission lets CI publish without any token (requires npm ≥ 11.5.1 on the runner). `secrets.NPM_TOKEN` remains only as a fallback.

## Using Claude Code

Claude Code can assist with the manual parts of the release:

```
> Prepare a release for vX.Y.Z
```

This should:

1. Bump the version in `package.json`
2. Move `[Unreleased]` entries into a new changelog section
3. Create the release branch, commit, and open a PR

The tag push and subsequent automation remain manual and human-initiated.

## Dry run

To test the publish workflow without actually releasing:

1. Go to Actions > Publish > Run workflow
2. Check "Run without publishing"
3. This runs the full build/test/pack pipeline without publishing

## Tradeoffs

**Why not Changesets?**

- Adds tooling complexity (changeset CLI, bot PRs) for a single-package repo
- Our release cadence doesn't warrant per-PR changelog fragments

**Why not semantic-release?**

- Removes human control over version numbers
- Commit message conventions are fragile and hard to enforce across contributors
- Over-engineered for a design system with deliberate, human-driven releases

**Why tag-driven?**

- Matches `standard_id` gem's release process — consistent across the org
- Clear separation: humans decide _when_ and _what version_, automation handles the rest
- Two-step verification: release PR validates content, tag push triggers publish
