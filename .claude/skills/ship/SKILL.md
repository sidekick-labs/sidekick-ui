---
name: ship
description: "Finalize changes in sidekick-ui, create a signed commit, and open a GitHub PR. Invoke when the user says 'ship', 'create a PR', 'open a pull request', 'push changes', 'finalize', 'ready for review', or '/ship'."
model: sonnet
---

# Ship Skill (sidekick-ui)

Finalize changes in the `@sidekick-labs/ui` shared component library, create a signed commit, and open a GitHub PR.

## Scope

This skill creates and updates **code PRs** only. It does **NOT**:

- Merge PRs to main (merging is a human decision — workspace CLAUDE.md Critical Rule #7)
- Delete branches after merge
- Tag a release / publish to npm — releases follow the separate **tag-driven** workflow documented in `RELEASING.md`. Version bumps + CHANGELOG entries land in their own dedicated `chore: release vX.Y.Z` PR; do not bundle them with feature/fix work.

**Important:** "Ship" means create/update a PR, never merge, never publish.

## Why this skill exists (vs. the generic workspace fallback)

The workspace router at `.claude/skills/ship/SKILL.md` provides a minimal manual fallback for repos without a stack-specific `/ship`. sidekick-ui is a shared design-system package consumed by both **sidekick-web** and **sidekick-harness**, so it has stack-specific concerns the generic fallback doesn't cover:

- A broken release simultaneously breaks both consumers' builds (CLAUDE.md Constraint #5).
- The repo has its own pre-push hook chain (`pre-push-prepare.sh` auto-rebases and injects `--force-with-lease`; `pre-push-lint.sh` runs the full validate suite). Bypassing them with `SKIP_PRE_PUSH_*` flags is the documented top cause of broken releases.
- Breaking changes need a consumer-impact sweep across `sidekick-web/app/frontend/` and `sidekick-harness/src/frontend/` _before_ push (CLAUDE.md Constraint #6).
- The `dist/` library build is gitignored, so a broken Vite library build never surfaces locally unless you ask it to.

## Branch Naming Convention

Use a Conventional Commits-style prefix matching the change type:

```
feat/<short-slug>     # new component, exported API, or feature
fix/<short-slug>      # bug fix
chore/<short-slug>    # tooling, deps, infra
ci/<short-slug>       # CI workflow changes
docs/<short-slug>     # README/CLAUDE/CHANGELOG-only changes
```

Linear identifiers are optional here — most sidekick-ui PRs (component additions, dep bumps, CI tweaks) aren't issue-tracked. If a Linear issue exists, prefix the slug (e.g. `feat/aifn-92-button-loading-state`).

## Workflow

### 0. Pre-flight (fail fast)

Run these checks **first**, before any commit or push work. Each one models a real failure mode for this repo.

```bash
# (a) Commit signing key configured. If unset, surface and stop —
# do NOT bypass with --no-gpg-sign, SKIP_SIGNED_COMMITS_HOOK=1, or any other flag.
# (Workspace CLAUDE.md Critical Rule #5.)
SIGNKEY=$(git config --get user.signingkey)
[ -z "$SIGNKEY" ] && echo "ABORT: user.signingkey unset — signing will fail" && exit 1

# (b) Do NOT probe the SSH agent with `ssh-add -l`. Git's signing path
# may use 1Password's agent socket (IdentityAgent in ~/.ssh/config),
# op-ssh-sign as gpg.ssh.program, a custom socket, or the default
# $SSH_AUTH_SOCK. `ssh-add -l` checks only the last one and gives
# false-positive aborts. Trust git: if signing actually fails at commit
# time, the signed-commits hook surfaces a clear error and halts.

# (c) Worktree edits only — confirm we're not in the main checkout.
GIT_DIR=$(git rev-parse --git-dir)
case "$GIT_DIR" in
  *.git/worktrees/*) ;;  # ok
  *) echo "ABORT: not in a worktree (workspace CLAUDE.md Rule #3)"; exit 1 ;;
esac

# (d) Clean tree before commit-prep — fail if there are stale untracked files
# the user didn't intend to ship.
git status --porcelain

# (e) Rebased on origin/main — the pre-push-prepare hook will auto-rebase
# on push, but checking now lets us spot conflicts early instead of mid-push.
git fetch origin main
BEHIND=$(git rev-list --count HEAD..origin/main)
[ "$BEHIND" -gt 0 ] && echo "INFO: branch is $BEHIND commit(s) behind origin/main — pre-push-prepare will auto-rebase"

# (f) node_modules present in this worktree (worktrees don't share them with
# the main checkout — pre-push-lint.sh silently uses the wrong tree otherwise).
[ -d node_modules ] || echo "WARN: node_modules missing in this worktree — run 'npm ci' before push"
```

If any **ABORT** line fired, stop and surface the error to the user. Never work around signing failures or unlock 1Password on the user's behalf — wait for them.

### 1. Gather context

```bash
git branch --show-current
git merge-base HEAD origin/main
git status
git diff HEAD
git log $(git merge-base HEAD origin/main)..HEAD --oneline
gh pr view --json url,state 2>/dev/null || echo "No PR exists"
```

**If a PR already exists** and its state is `OPEN`, skip PR creation in step 7 and just update the existing PR if needed. Report the existing URL.

### 2. Detect release-flavored changes (route to RELEASING.md instead)

```bash
git diff $(git merge-base HEAD origin/main)..HEAD --name-only | grep -E '^(package\.json|package-lock\.json|CHANGELOG\.md)$'
```

If `package.json`'s `version` field changed, **stop** and route to the release flow in `RELEASING.md`. A version bump goes in its own `chore: release vX.Y.Z` PR followed by a signed tag push — not mixed with feature/fix work. A non-`version` change to `package.json` (e.g. adding a dep) is fine to ship through this skill.

### 3. Consumer-impact sweep (breaking changes)

Required by CLAUDE.md Constraint #6 before declaring a component change done. Skip if changes are docs-only or strictly internal.

```bash
# Identify exported symbols you changed / renamed / removed.
git diff $(git merge-base HEAD origin/main)..HEAD -- src/index.ts src/components/

# For each renamed or removed export, grep the two consuming repos.
# Paths assume sibling checkouts under ~/Workspace/sidekick-labs/.
rg -n "<SymbolName>" ../sidekick-web/app/frontend/ 2>/dev/null
rg -n "<SymbolName>" ../sidekick-harness/src/frontend/ 2>/dev/null
```

If a consumer references a renamed/removed export, **either** keep the change backward-compatible (re-export the old name) **or** flag in the PR body that paired consumer PRs are needed and a major-version bump is queued in the next release PR. Do not silently ship a breaking change.

For new exported types / components, confirm they're re-exported from `src/index.ts` — types missing from the barrel are invisible to consumers even when the bundle includes them (CLAUDE.md cites a prior incident where `.d.ts` publish broke because the barrel was incomplete).

For new CSS variables added to `src/styles/theme.css`, verify **both** dark and light themes define the token.

### 4. Validate before commit

Run the same checks `pre-push-lint.sh` enforces. Fix any issues **before** staging so fixes are included in the squashed commit.

**CRITICAL: Never skip validation.** If a check cannot run (tool missing, network issue), **stop and ask the user** rather than pushing unvalidated code. The pre-push hook can be skipped with `SKIP_PRE_PUSH_HOOK=1`, but doing so ships a broken `@sidekick-labs/ui` release that simultaneously breaks sidekick-web AND sidekick-harness builds (CLAUDE.md Constraint #5). Don't.

Skip this step entirely if **only** documentation files (`.md`) changed.

#### 4a. Formatting & linting — auto-fix first, then verify

```bash
npm run format         # auto-fix
npm run format:check   # verify
npm run lint:fix       # auto-fix
npm run lint           # verify
npm run check          # tsc --noEmit
```

#### 4b. Tests

```bash
npm run test:run
```

If a test fails:

- Fix the code or test if the failure is related to current changes.
- If the failure is pre-existing and unrelated, note it in the PR description and proceed.

#### 4c. Library build sanity (when component source changed)

The `dist/` output is gitignored, so a broken Vite library build won't surface until CI. For changes touching `src/components/`, `src/hooks/`, `src/index.ts`, or `vite.config.ts`, run:

```bash
npm run build
ls dist/index.js dist/index.d.ts >/dev/null
grep -c "export declare" dist/index.d.ts  # sanity: types compiled
```

If `dist/index.d.ts` contains only `export {}`, the type build is broken — investigate before pushing. CLAUDE.md notes this exact failure mode has shipped before.

Skip if changes don't touch the library surface (e.g. CI-only, docs-only, internal test-only).

### 5. Create a single signed commit

```bash
git add -A
BASE=$(git merge-base HEAD origin/main)
git log $BASE..HEAD --oneline
```

**If there are existing commits on the branch**, squash them — the `pre-push-prepare.sh` hook blocks pushes with more than 1 commit ahead of main:

```bash
git reset --soft $(git merge-base HEAD origin/main)
```

Then commit using the **Conventional Commits** format (matches recent PR titles in this repo):

```bash
git commit -m "$(cat <<'EOF'
feat(scope): short imperative summary (max 72 chars)

Longer description of the change and rationale if needed.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Prefixes seen in recent merged PRs: `feat`, `fix`, `chore`, `build(deps)`, `build(deps-dev)`, `ci`, `docs`.

**Note:** The `-S` flag is automatically injected by the `enforce-signed-commits` hook — do not pass it manually and do not pass `--no-gpg-sign`. If signing fails, surface the exact error from the hook and stop (workspace CLAUDE.md Rule #5).

### 6. Push

Per workspace CLAUDE.md Rule #4, prefix with `LEFTHOOK=0` only — no other SKIP flags.

```bash
LEFTHOOK=0 git push -u origin HEAD
```

The repo's `pre-push-prepare.sh` will auto-rebase onto `origin/main` and inject `--force-with-lease` if history changed. `pre-push-lint.sh` then runs format/lint/typecheck/tests. If either hook fails, **fix the underlying issue** — never reach for `SKIP_PRE_PUSH_HOOK=1`, `SKIP_PRE_PUSH_PREPARE=1`, or `ALLOW_MULTIPLE_COMMITS=1` to work around it. Those flags exist for human emergencies only.

If pre-push-prepare rebased history, the same command will succeed (force-with-lease is already injected). No `--force-with-lease` flag needed from this skill.

### 7. Create the pull request

Match the repo's recent PR template — `## Summary` and `## Test plan` sections, with the Claude Code attribution footer:

```bash
gh pr create --title "<conventional commit title matching the commit>" --body "$(cat <<'EOF'
## Summary

- Bullet points of key changes (what + why)

## Test plan

- [ ] How to verify this works locally
- [ ] Any consumer-side checks needed (sidekick-web / sidekick-harness)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

#### Conditional sections

**Breaking change to a consumer-facing export:**

```markdown
## Breaking change

- `<OldName>` renamed to `<NewName>` / removed.
- Paired consumer PRs required:
  - sidekick-web: <link or "TODO">
  - sidekick-harness: <link or "TODO">
- Major version bump will be queued in the next release PR.
```

**New CSS token / theme variable:**

```markdown
## Theme tokens

- Added `--color-foo` / `--radius-bar` in both dark and light themes.
```

## Output

After completing the workflow, report:

1. The commit hash and message
2. The PR URL
3. Whether a paired consumer PR is needed (and which repos)
4. Whether a release/version bump is queued separately

## Rules (must)

1. **Never merge PRs** (workspace CLAUDE.md Critical Rule #7) — open + push + report, stop short of merge.
2. **Worktree-only edits** (workspace CLAUDE.md Rule #3).
3. **`LEFTHOOK=0` only** for git pushes — no `SKIP_PRE_PUSH_HOOK`, `SKIP_PRE_PUSH_PREPARE`, `SKIP_SIGNED_COMMITS_HOOK`, or `ALLOW_MULTIPLE_COMMITS` bypasses without explicit user permission (workspace CLAUDE.md Rule #4).
4. **Never bypass signing** (workspace CLAUDE.md Rule #5) — no `--no-gpg-sign`, `-c commit.gpgsign=false`, or `SKIP_SIGNED_COMMITS_HOOK=1`. If signing fails, surface the error and stop.
5. **No release work in code PRs** — `package.json` version bumps and `CHANGELOG.md` curation go in a separate `chore: release vX.Y.Z` PR per `RELEASING.md`.
6. **No `npm publish` from this skill** — publishing is automated by `publish.yml` on GitHub Release creation.

## Error handling

| Error                                                | Solution                                                                                                                                        |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `user.signingkey` unset                              | Stop, ask user to configure 1Password / signing — never bypass                                                                                  |
| Commit signing fails                                 | Surface the hook's error verbatim, stop, wait for user (workspace Rule #5)                                                                      |
| Pre-push lint fails                                  | Fix the underlying issue (run `npm run format`, `npm run lint:fix`, `npm run check`, `npm run test:run` locally) — never `SKIP_PRE_PUSH_HOOK=1` |
| Pre-push prepare blocks with >1 commit               | Squash via `git reset --soft $(git merge-base HEAD origin/main)` and re-commit — never `ALLOW_MULTIPLE_COMMITS=1`                               |
| Rebase conflict during pre-push prepare              | Resolve locally, re-commit, re-push                                                                                                             |
| `gh pr create` reports "PR already exists"           | Run `gh pr view --json url`, report existing URL, offer to update body                                                                          |
| `package.json` version changed in diff               | Stop and route to `RELEASING.md` — release PRs are separate                                                                                     |
| `dist/index.d.ts` shows only `export {}` after build | Stop — type build is broken; do not push a release that will break both consumers                                                               |

## Flags reference (this skill only)

| Flag          | Description                                                                                                                      |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `--no-squash` | Skip the squash in step 5; commit staged changes only (use when the branch already has exactly 1 commit and just needs a re-run) |
| `--draft`     | Create PR as draft in step 7                                                                                                     |
