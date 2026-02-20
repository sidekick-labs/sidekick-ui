#!/bin/bash
# Enforce signed commits hook for Claude Code
#
# Runs on PreToolUse event for Bash commands containing "git commit"
# Automatically injects the -S flag to ensure all commits are GPG/SSH signed
#
# Exit codes:
#   0 - Always (hook either modifies command or passes through unchanged)
#
# To skip this hook:
#   - Set SKIP_SIGNED_COMMITS_HOOK=1 environment variable
#   - Or include --no-gpg-sign in your command (explicit opt-out)

set -e

# Read tool input from stdin
INPUT=$(cat)
COMMAND=$(printf '%s' "$INPUT" | jq -r '.tool_input.command // ""')

# Only process "git commit" commands (with word boundaries)
if [[ ! "$COMMAND" =~ (^|[[:space:]\&\;\|])git[[:space:]]+commit([[:space:]]|$) ]]; then
  exit 0
fi

# Allow explicit opt-out via environment variable
if [[ "${SKIP_SIGNED_COMMITS_HOOK:-}" == "1" ]]; then
  echo "⏭️  Signed commits hook skipped (SKIP_SIGNED_COMMITS_HOOK=1)" >&2
  exit 0
fi

# Skip in CI environments
if [[ "${CI:-}" == "true" ]] || [[ -n "${GITHUB_ACTIONS:-}" ]]; then
  exit 0
fi

# Verify signing is configured
if ! git config --get user.signingkey >/dev/null 2>&1; then
  echo "⚠️  Git signing not configured (user.signingkey not set). Skipping auto-sign." >&2
  echo "   For GPG: git config --global user.signingkey <key-id>" >&2
  echo "   For SSH: git config --global gpg.format ssh && git config --global user.signingkey ~/.ssh/id_ed25519.pub" >&2
  exit 0
fi

# Check for explicit opt-out (--no-gpg-sign)
if printf '%s' "$COMMAND" | grep -qE -- '(^|[[:space:]])--no-gpg-sign([[:space:]]|$)'; then
  echo "⚠️  Commit without signing (--no-gpg-sign detected)" >&2
  exit 0
fi

# Inject -S flag into the git commit command
MODIFIED_COMMAND=$(printf '%s' "$COMMAND" | sed -E 's/(git[[:space:]]+commit)([[:space:]]|$)/\1 -S\2/')

echo "🔐 Auto-signing commit (added -S flag)" >&2

# Return JSON with updated command
jq -n \
  --arg cmd "$MODIFIED_COMMAND" \
  '{
    "hookSpecificOutput": {
      "hookEventName": "PreToolUse",
      "updatedInput": {
        "command": $cmd
      }
    }
  }'

exit 0
