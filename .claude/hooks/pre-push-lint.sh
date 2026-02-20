#!/bin/bash
# Pre-push linting hook for Claude Code
#
# Runs on PreToolUse event for Bash commands containing "git push"
# Blocks the push if linting or tests fail
#
# What it does:
#   1. Quick whitespace check (git diff --check)
#   2. npm run format:check (Prettier)
#   3. npm run lint (ESLint)
#   4. npm run check (TypeScript type checking)
#   5. npm run test:run (Vitest tests)
#
# Exit codes:
#   0 - Success (allow push) or skipped (not a push command)
#   2 - Failure (block push)
#
# To skip this hook:
#   - Set SKIP_PRE_PUSH_HOOK=1 environment variable

set -e

# Read tool input from stdin
INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // ""')

# Only run on actual "git push" commands
if [[ ! "$COMMAND" =~ (^|[[:space:]\&\;\|])git[[:space:]]+push([[:space:]]|$) ]]; then
  exit 0
fi

# Allow skipping the hook
if [[ "${SKIP_PRE_PUSH_HOOK:-}" == "1" ]] || [[ "$COMMAND" == SKIP_PRE_PUSH_HOOK=1* ]]; then
  echo "⏭️  Pre-push hook skipped (SKIP_PRE_PUSH_HOOK=1)" >&2
  exit 0
fi

# Skip in CI environments
if [[ "${CI:-}" == "true" ]] || [[ -n "${GITHUB_ACTIONS:-}" ]]; then
  exit 0
fi

echo "🔍 Pre-push checks triggered..." >&2

# 0. Quick whitespace check
echo "🔍 Checking for whitespace errors..." >&2
if ! git diff --check HEAD~1 2>/dev/null; then
  echo "❌ Git detected whitespace errors. Fix them before pushing." >&2
  exit 2
fi

# 1. Prettier formatting check
echo "📦 Running Prettier check..." >&2
if ! npm run format:check; then
  echo "❌ Prettier check failed. Run 'npm run format' to fix." >&2
  exit 2
fi

# 2. ESLint
echo "📦 Running ESLint..." >&2
if ! npm run lint; then
  echo "❌ ESLint failed" >&2
  exit 2
fi

# 3. TypeScript type checking
echo "📦 Running TypeScript check..." >&2
if ! npm run check; then
  echo "❌ TypeScript type check failed" >&2
  exit 2
fi

# 4. Tests
echo "🧪 Running tests..." >&2
if ! npm run test:run; then
  echo "❌ Tests failed" >&2
  exit 2
fi

echo "✅ All pre-push checks passed!" >&2
exit 0
