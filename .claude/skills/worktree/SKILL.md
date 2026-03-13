---
name: worktree
description: "Ensure clean working state before starting work. Detects uncommitted changes on the current branch and automatically moves to a worktree if needed, so new work is isolated. Use at the start of any session, or when the user says 'worktree', 'isolate', 'fresh start', or 'new worktree'. Also triggered by /start if it detects a dirty state."
---

# Worktree Skill

Ensures the working tree is clean before starting new work. If the main branch (or any current branch) has uncommitted changes from a previous session, this skill isolates new work in a `.worktrees/` directory within the repo.

## Why `.worktrees/`

Worktrees are created inside the repo at `.worktrees/<name>` (not under `.claude/worktrees/`). This ensures:
- Worktrees are accessible inside devcontainers (mounted at `/workspace/.worktrees/`)
- Consistent convention across all repos in the workspace
- The `.worktrees/` directory is gitignored in each repo

## Usage

```
/worktree                          # Assess current repo and set up if needed
/worktree <name>                   # Create a named worktree directly
/worktree --force                  # Always create a worktree, even if clean
```

## Workflow

### Phase 1: Detect Current State

Gather the repo state:

```bash
# Current branch
CURRENT_BRANCH=$(git branch --show-current)

# Default branch
DEFAULT_BRANCH=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@refs/remotes/origin/@@')
DEFAULT_BRANCH=${DEFAULT_BRANCH:-main}

# Uncommitted changes (staged + unstaged + untracked)
git status --porcelain

# Stash list (previous sessions may have stashed work)
git stash list
```

### Phase 2: Decision Tree

```
Current State Assessment
========================

┌─────────────────────────────┐
│ Working tree clean?         │
└─────────────────────────────┘
       │              │
      YES             NO
       │              │
       ▼              ▼
  ┌──────────┐   ┌──────────────────────────────────┐
  │ On       │   │ Changes detected.                 │
  │ default  │   │ These are likely from a previous  │
  │ branch?  │   │ session. Move to a worktree to    │
  │          │   │ isolate new work.                  │
  └──────────┘   └──────────────────────────────────┘
    │       │                    │
   YES     NO                   │
    │       │                   ▼
    ▼       ▼          Create worktree
  Stay    Stay         (auto or prompt)
  here    here
```

**Clean working tree:**
- If on default branch: fetch latest and stay. Ready for a new branch.
- If on a feature branch: inform the user which branch they're on. They may want to continue or start fresh.

**Dirty working tree (changes from previous session):**
- Automatically create a worktree for new work.
- The existing changes stay untouched on the current branch.
- Inform the user what was detected and where the worktree was created.

### Phase 3: Fetch Latest

Before creating a worktree, always fetch the latest default branch:

```bash
git fetch origin $DEFAULT_BRANCH
```

This ensures the worktree starts from the latest codebase.

### Phase 4: Create Worktree

**Naming convention:**

If a name is provided (e.g., from a Linear issue identifier):
```bash
git worktree add .worktrees/<name> -b <branch-name> origin/$DEFAULT_BRANCH
```

If no name is provided, generate one from context:
- If starting a Linear issue: use the issue identifier (e.g., `swe-123`)
- If the user described the task: use a short slug (e.g., `fix-auth-timeout`)
- Fallback: use the date (e.g., `2026-03-13`)

**Ensure `.worktrees/` is gitignored:**

```bash
# Check if .worktrees is already in .gitignore
if ! grep -q '\.worktrees' .gitignore 2>/dev/null; then
  echo '.worktrees/' >> .gitignore
fi
```

**Create the worktree:**

```bash
git fetch origin $DEFAULT_BRANCH
git worktree add .worktrees/<name> -b <branch-name> origin/$DEFAULT_BRANCH
```

### Phase 5: Report

After setup, display:

```
Worktree created at: .worktrees/<name>
Branch: <branch-name>
Based on: origin/main (fetched latest)

Previous state preserved:
  Branch: <original-branch>
  Changes: <summary of uncommitted changes left behind>

Working directory: .worktrees/<name>
```

If the working tree was already clean:

```
Working tree is clean on: <branch>
  (fetched latest origin/main)

Ready to start. Create a branch with:
  git checkout -b <branch-name> origin/main
```

## Integration with /start

The `/start` skill's decision tree (Phase 5: Set Up Git Branch) already handles worktree creation. This `/worktree` skill can be invoked independently or as a precursor to `/start` when the user wants to assess and isolate before picking up an issue.

When `/start` detects a dirty state (Scenarios B or D), it should follow the same conventions documented here:
- Worktrees go in `.worktrees/`
- Always fetch latest before creating
- Naming follows the `<identifier>` convention

## Integration with /cleanup

The `/cleanup` skill already handles stale worktree detection and removal in `.worktrees/`. This skill creates worktrees; `/cleanup` removes them when done.

## Error Handling

| Error | Solution |
|-------|----------|
| `.worktrees/<name>` already exists | Offer to reuse existing or create with suffix |
| Branch name already exists | Check out existing branch in the worktree instead of `-b` |
| No origin remote | Create worktree from local default branch HEAD |
| Fetch fails | Warn and create from local default branch HEAD |
| `.gitignore` is read-only | Warn the user to add `.worktrees/` manually |

## Safety Rules

1. **Never discard uncommitted changes** - the whole point is to preserve them
2. **Never force-checkout** over dirty state - always worktree instead
3. **Always fetch before creating** - worktrees should start from latest
4. **Never delete worktrees without /cleanup** - this skill only creates
