#!/bin/bash
# Enforce worktree-only file mutations for the Bash tool.
#
# Companion to enforce-worktree.sh (which covers Edit/Write/NotebookEdit).
# Runs on PreToolUse for Bash. Blocks tree-mutating Bash commands whose target
# is a MAIN checkout (not a worktree).
#
# This closes the documented gap where the editor hook is bypassed by writing
# the working tree through Bash — the vector that once scribbled 100+ stale
# files onto an app repo's main checkout (bin/devcontainer-exec rsyncing
# container state back onto it).
#
# Exit codes:
#   0 — allow (worktree, CI, non-git path, or not a tree-mutating command)
#   2 — block (tree-mutating command targeting a main checkout, or a command
#              this guard could not parse confidently while in a main checkout)
#
# ---------------------------------------------------------------------------
# HOW IT DECIDES (rewritten 2026-07-22)
#
# The old implementation substring-matched its trigger words against the whole
# command TEXT. That was wrong in both directions:
#   * it OVER-blocked prose — `gh issue create --body "…bin/devcontainer-exec…"`
#     writes nothing, but the tool's name appearing in the body tripped it;
#   * it UNDER-blocked real writes — `git -C <main> apply`, `> file`, `tee`,
#     `cp`/`mv` into a main checkout all sailed through.
# Both are the same root cause: it scanned text instead of understanding the
# command. This version lexes the command properly (POSIX-ish shell grammar:
# quoting, escapes, heredocs, command substitution, pipelines, redirections)
# and inspects the COMMAND NAME of each simple command, plus the destination
# paths of the commands that write files.
#
# What it blocks:
#   1. A content-introducing command whose working directory is a main checkout
#      — bin/devcontainer-exec, rsync, patch, sed -i / perl -i,
#        git stash pop|apply, git apply, git am, git cherry-pick, git revert.
#      The working directory is tracked across `cd`/`pushd` in the command, and
#      for git it is taken from `-C <path>` when present (the documented gap).
#   2. A write whose DESTINATION PATH lands inside a main checkout, no matter
#      where it is run from — shell redirections (`>`, `>>`), tee, cp, mv,
#      install, rsync's destination, sed -i / perl -i's file arguments.
#   3. Anything it cannot parse confidently while a main checkout is in play
#      (unterminated quote, unbalanced `$(`, unresolvable `~user`/`$VAR` cd
#      target). Fail closed: an over-block on an exotic command is much cheaper
#      than letting a real write through.
#   4. From a main checkout, any write destination bash computes (2026-11-23):
#      a word with $VAR / ${…} / $(…) / `…` / $((…)) / $'…' / $"…", brace
#      expansion, a glob, or a tilde form other than a plain ~ or ~/ prefix
#      blocks, whatever value the guard thinks it has. "From a main checkout"
#      means the hook's working directory, or the directory the line has cd'd
#      to (or may still be in), is one. A computed cd target there makes the
#      directory unknown, so later relative writes block. Literal paths are
#      resolved as before; worktrees and other directories keep the rules below.
#   5. After a directory change it cannot resolve, any relative write, wherever
#      the line runs (2026-11-23): a cd / pushd / popd whose directory is empty,
#      an option only, an unknown option, more than one word, a glob or brace
#      expansion, or built from any expansion makes the working directory
#      UNRESOLVED. A cd target is never resolved from the line's own bindings.
#      Relative writes and in-place commands then block, from a main checkout
#      or a worktree alike; absolute and ~ destinations are judged as usual. A
#      literal absolute cd settles it again. A cd that may not run (after && /
#      ||, inside if / while / until / for / select / case) may leave the shell
#      where it was. One before a `|` or `&` (a child shell) or after env /
#      sudo / … does not move this shell; one at the END of a pipeline may or
#      may not (lastpipe; zsh / ksh), so it leaves the directory unknown.
#   6. Anything that makes bash do something other than what this guard models,
#      while a main checkout is in play (2026-11-23): eval, readonly /
#      declare|typeset|local -r, trap 'CMD', alias, enable, set -r, shopt
#      cdable_vars, and function definitions. Function/alias/enable/set -r also
#      make the working directory unknown for the rest of the line, so relative
#      writes after them block anywhere.
#
# Ambiguity is unresolved, and unresolved fails closed (2026-11-23):
#   * a `$` that was quoted ('$D', \$D, "\$D") is literal: the word is
#     unresolvable, never D's value. $'…' and $"…" strings are unresolvable too;
#   * an unresolvable path whose literal start is inside a main checkout
#     (`<main>/$X`) blocks from anywhere;
#   * every reading of ${D:-w} / ${D=w} / ${D:+w} … is judged, and ${D:=w} /
#     ${D=w} assign D wherever they appear (arguments, redirections,
#     here-strings, unquoted heredoc bodies);
#   * values set by set --, printf -v, read <<< and for loops are judged;
#   * a quoted or escaped NAME ("D=x", 'D'=x, D\=x) is a command name, not an
#     assignment: D keeps its value (and is no longer trusted);
#   * declare / typeset / local -l -u -c -i -a -A transform what bash stores:
#     such a name is never bound and any use of it blocks;
#   * a value with whitespace or glob characters is never bound (an unquoted
#     $D splits or globs): each field is judged, and a glob value blocks;
#   * a cd whose target does not exist (and was not made by mkdir or git
#     worktree add on the line) may fail, leaving the shell where it was; so do
#     `cd -` and `popd` return there, and CDPATH is followed.
#
# What it deliberately does NOT block:
#   * pristine-RESTORING commands (git checkout HEAD -- ., git restore,
#     git clean) and branch switches — /cleanup and branch-switching flows need those on main;
#   * git commit / merge / pull / fetch — they introduce no foreign content
#     into the working tree, and /cleanup + /ship legitimately run them on main;
#   * reading anything, anywhere;
#   * a trigger word appearing inside a quoted argument, a heredoc body, a
#     commit message, or a filename — that is the bug this rewrite fixes.
#
# Known, accepted limits (documented rather than silently hoped away):
#   * an opaque command name (`$(which rsync) …`) is not resolved — but its
#     substitution IS analysed, and its destination paths are still checked;
#   * remote execution (`ssh host rsync …`) is out of scope;
#   * `dd of=…`, `touch`, `mkdir` and editors are not treated as writers of a
#     literal path; from a main checkout their computed targets block (rule 4);
#   * values that only exist at run time (read from a file, $(…)) are
#     unresolvable: they block from a main checkout (rule 4), not elsewhere;
#   * aliases and functions inherited from the user's shell are not visible,
#     and CDPATH is read from this hook's environment.
#
# Requires bash 3.2 (macOS /bin/bash). No bash-4 features (no mapfile, no
# associative arrays, no ${arr[-1]}).
# ---------------------------------------------------------------------------

# --- input -----------------------------------------------------------------

# Skip in CI environments (the only sanctioned exception).
if [[ "${CI:-}" == "true" ]] || [[ -n "${GITHUB_ACTIONS:-}" ]]; then
  exit 0
fi

INPUT=$(cat)

DEGRADED=0
if command -v jq >/dev/null 2>&1; then
  TOOL_NAME=$(printf '%s' "$INPUT" | jq -r '.tool_name // ""') || exit 2
  [[ "$TOOL_NAME" == "Bash" ]] || exit 0
  CMD=$(printf '%s' "$INPUT" | jq -r '.tool_input.command // ""') || exit 2
  [[ -z "$CMD" ]] && exit 0
else
  # jq is a setup prerequisite. If it is missing we cannot parse the payload,
  # so we degrade to the old, deliberately over-eager substring scan of the RAW
  # payload rather than failing open. The scan only knows the legacy trigger
  # commands (bin/devcontainer-exec, rsync, patch, sed/perl -i, git apply/am/
  # cherry-pick/revert/stash pop|apply): it over-blocks on those, but plain
  # redirections, tee, cp and mv are NOT caught until jq is back. It still lets
  # `brew install jq` through, so this is not a bootstrap deadlock.
  DEGRADED=1
  CMD="$INPUT"
fi

# --- small helpers ----------------------------------------------------------

# Out-parameters. Bash functions can only return an exit status, so helpers
# hand their result back through these:
#   RET      — the value (an expanded path, a selected argument)
#   RETUNRES — 1 when a path could not be resolved (unknown $VAR, ~otheruser)
#   RETCOUNT — how many candidates a selecting helper saw (_last_nonflag)
# Read them immediately after the call that sets them; the next call overwrites.
RET=""
RETUNRES=0
RETDANGER=0
RETCOUNT=0
RETP=""          # _dest_risk: the path it judged
RETWHY=""        # _dest_risk: why it judged it so (appended to block messages)
ALTS=()          # _alt_candidates: the readings of a word

# bash 5.2 makes `&` in a ${var//pat/rep} replacement mean "the match"; every
# replacement below means a literal string.
shopt -u patsub_replacement 2>/dev/null || true

# Placeholders the lexer leaves in a word where quoting decided what bash will
# do. Each contains a `$`, so any word holding one reads as unresolvable (fail
# closed) everywhere a path is judged. _script_text turns them back into shell
# text for eval / bash -c / trap / alias, which re-parse their argument.
LITD='${__literal_dollar__}'     # a `$` that was quoted or escaped: a literal $
QMARK='${__quoted_string__}'     # after a $'…' or $"…" string (decoded in full)
QLOST='${__undecoded_escape__}'  # a $'…' escape left undecoded; the rest of it is lost
QTILDE='${__quoted_tilde__}'     # before a quoted / escaped leading ~ ('~/x'): never tilde-expanded
BQ=0             # >0 while lexing inside backticks, where \$ is NOT literal

# The line does something this guard cannot follow (eval, readonly, a function
# definition, …): block when a main checkout is in play. Holds the reason.
UNMOD_WHY=""
POS_DANGER=0     # positional parameters ($1, $@, …) may hold a main-checkout path
FN_SEEN=0        # a function/alias/enable may have changed what cd and friends do
CDPATH_TAINT=0   # CDPATH is mentioned on this line: its value is not the inherited one
OLDPWD_TAINT=0   # OLDPWD is mentioned on this line: cd - may go anywhere
DIRSTK_TAINT=0   # DIRSTACK is mentioned on this line: popd may go anywhere
CREATED=()       # directories mkdir / git worktree add create on this line
HOME_TAINT=0     # HOME may change on this line: ~ and $HOME are not the inherited value
TILDE_SEEN=0     # a write landed on a ~ path, or relative to a cd ~ (re-judged at the end)
TILDE_CD=0       # the cwd still depends on a cd ~ / cd ~/… (saved and restored with it)
TILDE_CD_EVER=0  # a cd ~ ran on this line: cd - / popd may return to it (sticky)
ATTR_N=()        # names given a value-transforming attribute (declare -l, -u, -i, …)

_expand_path() { # $1 -> RET (expanded), RETUNRES=1 when it cannot be resolved
  local p="$1"
  RETUNRES=0
  RETDANGER=0
  if [[ "$p" == "$QTILDE"* ]]; then
    # A quoted leading ~ ('~/x'): a literal path component, never HOME.
    p="${p#"$QTILDE"}"
  else
    case "$p" in
      '~'|'~/'*)
        if _home; then p="$RET${p#\~}"; else RETUNRES=1; fi ;;
      '~'*) RETUNRES=1 ;;   # ~otheruser, ~+, ~- — cannot resolve
    esac
  fi
  case "$p" in *'$'*) _subst_vars "$p"; p="$RET" ;; esac
  case "$p" in *'$'*) RETUNRES=1 ;; esac
  RET="$p"
}

# What ~ and $HOME expand to: the inherited HOME. HOME is never bound
# (_var_set); an assignment that may point it into a main checkout makes it
# DANGER. HOME_TAINT does not change this reading (judging it keeps ~/<main>
# blocked from a worktree); it only makes ~ computed for rule 4 (_nonliteral).
_home() { # -> RET; return 1 when unknown (RETDANGER=1 when it may be a main path)
  if _var_is_danger HOME; then RETDANGER=1; return 1; fi
  RET="$HOME"
}

# A word whose value bash computes: any expansion, brace expansion, a glob, or
# a tilde form other than a plain ~ / ~/ prefix under an unchanged HOME. The
# lexer has dropped quoting, so a quoted '*' or '{' counts too (an accepted
# false positive); every quoted `$` is already a placeholder holding one.
_nonliteral() { # $1 lexed word -> 0 when bash computes its value
  case "$1" in
    *'$'*|*'`'*|*[{}*?[]*) return 0 ;;
    '~'|'~/'*)
      [[ "$HOME_TAINT" == "1" ]] && return 0
      _var_is_danger HOME && return 0
      return 1 ;;
    '~'*) return 0 ;;
  esac
  return 1
}

_main_in_play() { # -> 0 when the line starts, is, or may still be in a main checkout
  _dir_is_main "$CURDIR" || _dir_is_main "$PWD" || { [[ -n "$DIR_ALT" ]] && _dir_is_main "$DIR_ALT"; }
}

_main_dir() { # -> RET: the main checkout in play (for the block message)
  local d
  RET="$PWD"
  for d in "$CURDIR" "$DIR_ALT" "$PWD"; do
    if [[ -n "$d" ]] && _dir_is_main "$d"; then RET="$d"; return 0; fi
  done
}

# Rule 4: from a main checkout, a computed write destination blocks.
_check_literal() { # $1 lexed destination word -> 0 when it blocked
  # HOME may change later on the line: the end of the run judges ~ writes again.
  case "$1" in '~'|'~/'*) TILDE_SEEN=1 ;; /*) ;; *) (( TILDE_CD )) && TILDE_SEEN=1 ;; esac
  _nonliteral "$1" || return 1
  _main_in_play || return 1
  _main_dir
  _block "write to '$1', a destination built from an expansion" "$RET" nonliteral
  return 0
}

# Variables assigned earlier in the SAME command line (`SP=/tmp/x; cat > "$SP/f"`,
# `export D=…; cd "$D"`), as two parallel arrays. Agents set a scratch dir this
# way in almost every call, because shell state does not persist between Bash
# calls; without this, every such write from a main checkout read as an
# unresolvable destination and failed closed. Only values that themselves fully
# resolve are kept, so a `$(…)` or unknown variable still fails closed.
VAR_K=()
VAR_V=()
# Names that are no longer bound but may still hold a path inside a main
# checkout (their last binding, or a value a skipped/unknown assignment may
# have given them, resolved into one). Forgetting such a name would fall back
# to "unresolvable", which is allowed outside a main checkout, so a use of a
# DANGER name blocks wherever the command runs. Sticky for the whole line.
VAR_D=()
NEXT_COND=0   # the next command runs only conditionally (after && / ||)
NEXT_PIPE=0   # the next command is a pipeline member (a child shell)
LINE_CTRL=0   # sticky: a compound command keyword has appeared on this line
CTRL_DEPTH=0  # how many if / while / until / for / case / select are open ({ … } always runs)
CTRL_STK=()   # per open compound: "<1 when it opened after a |>:<if|loop|case|brace>[:d]"
CASE_PAT=0    # the next simple command is a case pattern list (after `case … in` or ;;);
              # 2 after a leading `(`, where even esac is a pattern
CASE_OPENED=0 # the command just inspected was `case WORD in …`
LX_CPAREN=0   # the command being lexed is `case WORD in (` (its first pattern follows)
CTRL_SNAP=()  # per open compound: the directory state and bindings it opened with
IC_OPENED=0   # the command being inspected opened a compound ({ cd x; … } | …)
PHYS=0        # set -P / set -o physical may be on: cd resolves .. through symlinks
PHYS_ENV=0    # physical comes in through an exported SHELLOPTS (a new shell inherits it)
case ":${SHELLOPTS:-}:" in *:physical:*) PHYS=1; PHYS_ENV=1 ;; esac
SHOPTS_TAINT=0 # SHELLOPTS is mentioned on this line (export SHELLOPTS, …)
CD_COUNT=0    # bumped by every directory change that persists in the shell being modelled
              # (put back, like the directory, on leaving a subshell / bash -c / child compound)
LX_TERM=seq   # what ends the command being inspected: seq|and|or|pipe|bg

_var_get() { # $1 name -> RET value, return 1 when unknown
  local i
  for ((i = ${#VAR_K[@]} - 1; i >= 0; i--)); do
    if [[ "${VAR_K[i]}" == "$1" ]]; then RET="${VAR_V[i]}"; return 0; fi
  done
  return 1
}

_var_is_danger() { # $1 name -> 0 when listed in VAR_D
  local d
  for d in "${VAR_D[@]}"; do [[ "$d" == "$1" ]] && return 0; done
  return 1
}

_mark_danger_if_main() { # $1 name, $2 path (relative = against CURDIR)
  [[ -z "$2" ]] && return 0
  local path="$2"
  [[ "$path" != /* ]] && path="$CURDIR/$path"
  if _dir_is_main "$path"; then _var_is_danger "$1" || VAR_D+=("$1"); fi
  return 0
}

_forget() { # $1 name -> drop its binding (and danger mark) without judging it
  local i
  for ((i = 0; i < ${#VAR_K[@]}; i++)); do
    [[ "${VAR_K[i]}" == "$1" ]] && VAR_K[i]="" && VAR_V[i]=""
  done
}

_var_poison() { # $1 name, [$2 a candidate raw value] -> unknown from here on
  # A name bound earlier on this line and now changed in a way we can't follow
  # (printf -v, read, a skipped or quoted assignment, …) could hold anything,
  # including a main-checkout path, so it becomes DANGER outright. _var_set
  # clears this again when the change turns out to be a definite re-binding.
  if _var_get "$1"; then _var_is_danger "$1" || VAR_D+=("$1"); fi
  # A candidate value that may point into a main checkout — directly, through a
  # known variable (D=$ROOT, D=${ROOT%/}), through a default (D=${X:-<main>}),
  # or with an unresolvable part under one (D=<main>/$X) — makes it DANGER.
  if [[ -n "${2:-}" ]] && _value_risky "$2"; then _var_is_danger "$1" || VAR_D+=("$1"); fi
  _forget "$1"
}

# Every reading of a word bash may produce: the word itself, plus each
# ${NAME:-w} / ${NAME-w} / ${NAME:=w} / ${NAME=w} / ${NAME:+w} / ${NAME+w}
# with w in its place (innermost first, so nested defaults unwind).
_alt_candidates() { # $1 word -> ALTS
  ALTS=("$1")
  local i=0 s
  local re='^(.*)\$\{([A-Za-z_][A-Za-z0-9_]*|[0-9]+|[@*#?$!-])(\[[^]]*\])?:?([-=+])([^}]*)\}(.*)$'
  while (( i < ${#ALTS[@]} && ${#ALTS[@]} < 16 )); do
    s="${ALTS[i]}"
    if [[ "$s" == *'${'* && "$s" =~ $re ]]; then
      ALTS+=("${BASH_REMATCH[1]}${BASH_REMATCH[5]}${BASH_REMATCH[6]}")
    fi
    i=$((i + 1))
  done
}

# Judge one reading of a path. RET: danger (a variable in it may point into a
# main checkout), main (it, or the literal directory before its first
# unresolvable part, is in one), unres (unresolvable, nothing known under a main
# checkout), or safe.
_dest_risk() { # $1 word, $2 base dir -> RET, RETP, RETWHY
  local e unres p q
  RETWHY=""
  _expand_path "$1"; e="$RET"; unres="$RETUNRES"
  if [[ "$RETDANGER" == "1" ]]; then RET=danger; RETP="$2"; return 0; fi
  p="$e"; [[ "$p" != /* ]] && p="$2/$p"
  RETP="$p"
  if [[ "$unres" == "1" ]]; then
    # `<main>/$X`, `'<main>/$D'`: whatever the unresolvable part turns out to
    # be, it starts inside the main checkout.
    q="${p%%\$*}"
    if [[ "$q" == */* ]]; then
      q="${q%/*}"; [[ -z "$q" ]] && q=/
      if [[ "$q" != "$2" ]] && _dir_is_main "$q"; then
        RET=main; RETP="$q"; RETWHY=" (its unresolvable part is under a main checkout)"; return 0
      fi
    fi
    RET=unres; return 0
  fi
  if _dir_is_main "$p"; then RET=main; return 0; fi
  RET=safe
}

_value_risky() { # $1 value -> 0 when some reading of it may point into a main checkout
  local -a alts
  local a
  _alt_candidates "$1"; alts=("${ALTS[@]}")
  for a in "${alts[@]}"; do
    [[ -z "$a" ]] && continue
    _dest_risk "$a" "$CURDIR"
    [[ "$RET" == main || "$RET" == danger ]] && return 0
  done
  return 1
}

# ${NAME:=w} / ${NAME=w} assign NAME in this shell wherever they are expanded:
# an argument, a redirection target, a here-string, an unquoted heredoc body.
# ${!N:=w} assigns a variable named by N's value: drop every binding.
_scan_default_assigns() { # $@ words
  local wd rest bang nm val
  local re='\$\{(!?)([A-Za-z_][A-Za-z0-9_]*)(\[[^]]*\])?:?=([^}]*)\}?(.*)$'
  for wd in "$@"; do
    [[ "$wd" == *'${'* ]] || continue
    rest="$wd"
    while [[ "$rest" =~ $re ]]; do
      bang="${BASH_REMATCH[1]}" nm="${BASH_REMATCH[2]}" val="${BASH_REMATCH[4]}" rest="${BASH_REMATCH[5]}"
      if [[ -n "$bang" ]]; then _var_clear_all; continue; fi
      [[ "$nm" == HOME ]] && HOME_TAINT=1
      _var_poison "$nm" "$val"
    done
  done
  return 0
}

_unmodelled() { # $1 why -> remember the first reason this line can't be followed
  [[ -z "$UNMOD_WHY" ]] && UNMOD_WHY="$1"
  return 0
}

# A function definition, an alias or `enable` can change what any later command
# does, cd included: from here on the working directory is unknown (relative
# writes block) and no binding is trusted.
_fn_taint() {
  FN_SEEN=1; DIR_UNRESOLVED=1; DIR_DANGER=1; OLD_CUR="?"; DIRSTK_TAINT=1
  DIR_WHY="a function, alias, enable or set -r (cd may no longer be the builtin)"
  _var_clear_all
}

_script_text() { # $1 lexed word -> RET: the text eval / bash -c / trap re-parse
  local s="$1" d='$'
  if [[ "$s" == *"$QLOST"* ]]; then PARSE_ERROR=1; s="${s//"$QLOST"/}"; fi
  s="${s//"$QMARK"/}"; s="${s//"$QTILDE"/\\}"
  RET="${s//"$LITD"/$d}"
}

# Code that runs LATER (a trap handler, an alias's text): judge its writes, but
# do not let its cd or assignments change the state the rest of the line is
# judged in. Trap handlers are judged again at the end, in the line's final
# state (an EXIT handler runs then).
DEFERRED=()
DEF_DST=0; DEF_OPT=0; DEF_AT=(); DEF_PHYS=0; DEF_SOT=0
_analyze_deferred() { # $1 shell text
  local sdir="$CURDIR" sunres="$DIR_UNRESOLVED" sdanger="$DIR_DANGER" swhy="$DIR_WHY"
  local salt="$DIR_ALT" sguard="$ALT_GUARD" sold="$OLD_CUR"
  local snc="$NEXT_COND" snp="$NEXT_PIPE" stcd="$TILDE_CD"
  local sdst="$DIRSTK_TAINT" sopt="$OLDPWD_TAINT" sphys="$PHYS" ssot="$SHOPTS_TAINT"
  local -a sstk=("${DIRSTK[@]}") svk=("${VAR_K[@]}") svv=("${VAR_V[@]}") sat=("${ATTR_N[@]}")
  # The body starts with the stack / OLDPWD as uncertain as they are now.
  NEXT_PIPE=0; NEXT_COND=0
  _analyze_text "$1"
  # What the body did to the stack / OLDPWD (a mid-line trap applies it).
  DEF_DST="$DIRSTK_TAINT"; DEF_OPT="$OLDPWD_TAINT"; DEF_AT=("${ATTR_N[@]}"); DEF_PHYS="$PHYS"; DEF_SOT="$SHOPTS_TAINT"
  DIRSTK_TAINT="$sdst"; OLDPWD_TAINT="$sopt"; ATTR_N=("${sat[@]}"); PHYS="$sphys"; SHOPTS_TAINT="$ssot"
  TILDE_CD="$stcd"
  CURDIR="$sdir"; DIR_UNRESOLVED="$sunres"; DIR_DANGER="$sdanger"; DIR_WHY="$swhy"
  DIR_ALT="$salt"; ALT_GUARD="$sguard"; OLD_CUR="$sold"
  NEXT_COND="$snc"; NEXT_PIPE="$snp"
  DIRSTK=("${sstk[@]}"); VAR_K=("${svk[@]}"); VAR_V=("${svv[@]}")
  return 0
}

_was_created_exact() { # $1 absolute path -> 0 when mkdir / git worktree add made exactly it
  local c
  for c in "${CREATED[@]}"; do [[ "$c" == "$1" ]] && return 0; done
  return 1
}

_was_created() { # $1 absolute path -> 0 when mkdir / git worktree add made it (or below it)
  local c
  for c in "${CREATED[@]}"; do
    [[ "$c" == "$1" || "$c" == "$1"/* ]] && return 0
  done
  return 1
}

_alt_active() { # -> 0 when a cd that may have failed could have left us in DIR_ALT
  [[ -n "$DIR_ALT" && "$ALT_GUARD" == "0" ]]
}

# Variables bash itself writes (BASH_REMATCH after =~, REPLY after read, PWD
# after cd, PIPESTATUS after every pipeline, …). Their value can change behind
# any command, so they are never bound.
_shell_managed() { # $1 name -> 0 when bash may write it implicitly
  case "$1" in
    BASH|BASH_*|BASHOPTS|BASHPID|COMP_*|COMPREPLY|READLINE_*|HIST*|PS[0-9]|\
    REPLY|MAPFILE|OPTARG|OPTIND|OPTERR|PWD|OLDPWD|DIRSTACK|PIPESTATUS|\
    RANDOM|SRANDOM|SECONDS|LINENO|EPOCHSECONDS|EPOCHREALTIME|FUNCNAME|\
    GROUPS|HOSTNAME|HOSTTYPE|MACHTYPE|OSTYPE|PPID|UID|EUID|SHELLOPTS|SHLVL|\
    COPROC|COPROC_*|LINES|COLUMNS|_)
      return 0 ;;
  esac
  return 1
}

_var_has_attr() { # $1 name -> 0 when declare/typeset/local gave it a transforming attribute
  local d
  for d in "${ATTR_N[@]}"; do [[ "$d" == "$1" ]] && return 0; done
  return 1
}

_var_set() { # $1 name, $2 raw value (already lexed: quotes removed)
  _var_poison "$1"
  # declare -l D; D=/X stores /x: the literal is not the value. Never bound,
  # always DANGER (its value may name a main checkout).
  if _var_has_attr "$1"; then _var_is_danger "$1" || VAR_D+=("$1"); return 0; fi
  # Never bound, but a main-checkout value still makes it DANGER.
  _shell_managed "$1" && { _var_poison "$1" "$2"; return 0; }
  # HOME is never bound either: the lexer drops quoting, so a command word
  # 'HOME=x' looks like an assignment, and ~ must keep its inherited reading.
  [[ "$1" == HOME ]] && { _var_poison "$1" "$2"; return 0; }
  # The lexer has dropped quoting, so `P='$D'` (literal) and `P=$D` (expanded)
  # look the same here, as do `'~/x'` and `~/x`. Bind only plain literals.
  case "$2" in *'$'*|'~'*|*':~'*) _var_poison "$1" "$2"; return 0 ;; esac
  # Quoting is gone too, so an unquoted $D may split on whitespace or glob:
  # D='/tmp/x <main>/f'; tee $D writes both. Bind neither; judge each field,
  # and a glob value may match anything (DANGER).
  case "$2" in
    *[[:space:]]*)
      local fld
      local -a flds=()
      IFS=$' \t\n' read -r -d '' -a flds <<< "$2"
      for fld in "${flds[@]}"; do _var_poison "$1" "$fld"; done
      _var_poison "$1" "$2"; return 0 ;;
    *[*?[]*)
      _var_poison "$1"; _var_is_danger "$1" || VAR_D+=("$1"); return 0 ;;
  esac
  _expand_path "$2"
  [[ "$RETUNRES" == "1" ]] && return 0
  VAR_K+=("$1"); VAR_V+=("$RET")
  # A definite assignment replaces whatever it held, so it is no longer DANGER.
  local -a keep=() d
  for d in "${VAR_D[@]}"; do [[ "$d" == "$1" ]] || keep+=("$d"); done
  VAR_D=("${keep[@]}")
}

# How an assignment in the command being inspected affects the parent shell:
# "bind" (it runs here, unconditionally), "skip" (it runs in a child: a
# pipeline member, a background job, or a prefix like `env X=1`), or "poison"
# (it may or may not run: after && / ||, or anywhere once a compound command
# such as if/while/case/{ … } has appeared on the line).
_assign_mode() { # -> RET
  if [[ "$LX_TERM" == "pipe" || "$LX_TERM" == "bg" ]]; then
    RET=skip
  elif [[ "$NEXT_PIPE" == "1" && "$IC_OPENED" == 0 ]]; then
    # A pipeline's last member runs in this shell under lastpipe (and always
    # in zsh / ksh): it may or may not assign here.
    RET=poison
  elif [[ "$NEXT_COND" == "1" || "$LINE_CTRL" == "1" ]] || (( DEPTH > 1 )); then
    RET=poison
  else
    RET=bind
  fi
}

# Bash has many ways to change a variable besides NAME=value: unset, read,
# for/select, printf -v, mapfile, getopts, NAME+=, NAME[i]=, a prefix before a
# special builtin (`D=x export D`), let/(( )), eval, bash -c. Rather than model
# each, any word that names a bound variable (bare `D`, or `D=…`, `D+=…`,
# `D[…`) poisons it; only the narrow binding paths below re-bind it.
HOMEWORD='(^|[^A-Za-z0-9_])HOME([^A-Za-z0-9_]|$)'
_poison_mentions() { # $@ words
  local wd nm i hw
  local -a all=()
  for wd in "$@"; do
    all+=("$wd")
    # An indirect name (`N=D; printf -v "$N"`) mentions D only after expansion.
    if [[ "$wd" == *'$'* ]]; then _subst_vars "$wd"; [[ "$RET" == "$wd" ]] || all+=("$RET"); fi
  done
  for wd in "${all[@]}"; do
    # Any mention: cd stops trusting the inherited CDPATH (a binding still wins).
    [[ "$wd" == *CDPATH* ]] && CDPATH_TAINT=1
    # cd - goes to $OLDPWD and popd to ${DIRSTACK[1]}: an assignment to either
    # (OLDPWD=…, DIRSTACK[1]=…, read OLDPWD, …) sends them anywhere.
    [[ "$wd" == *OLDPWD* ]] && OLDPWD_TAINT=1
    [[ "$wd" == *DIRSTACK* ]] && DIRSTK_TAINT=1
    [[ "$wd" == *SHELLOPTS* ]] && SHOPTS_TAINT=1
    # A bare HOME (HOME=…, read HOME, printf -v HOME, …), not a $HOME read:
    # ~ and $HOME may no longer hold the inherited value.
    hw="${wd//\$\{HOME/}"; hw="${hw//\$HOME/}"
    [[ "$hw" =~ $HOMEWORD ]] && HOME_TAINT=1
    if [[ "$wd" =~ ^([A-Za-z_][A-Za-z0-9_]*)\+=(.*)$ ]]; then
      nm="${BASH_REMATCH[1]}"
      # NAME+=lit: the new value is the old one with lit appended (or just lit
      # when NAME was unset).
      if _var_get "$nm"; then _var_poison "$nm" "$RET${BASH_REMATCH[2]}"
      elif ! _var_is_danger "$nm"; then _var_poison "$nm" "${BASH_REMATCH[2]}"; fi
    elif [[ "$wd" =~ ^([A-Za-z_][A-Za-z0-9_]*)\[([^]]*)\](\+?)=(.*)$ ]]; then
      nm="${BASH_REMATCH[1]}"
      # The subscript is arithmetic and can itself assign (a[D=1]=x).
      if [[ "${BASH_REMATCH[2]}" == *=* ]]; then _var_clear_all; continue; fi
      # D[0]=v writes scalar D; treat v as what D may now hold.
      if _var_get "$nm"; then
        if [[ -n "${BASH_REMATCH[3]}" ]]; then _var_poison "$nm" "$RET${BASH_REMATCH[4]}"
        else _var_poison "$nm" "${BASH_REMATCH[4]}"; fi
      elif _var_is_danger "$nm"; then :
      else _var_poison "$nm" "${BASH_REMATCH[4]}"; fi
    elif [[ "$wd" =~ ^([A-Za-z_][A-Za-z0-9_]*)(=|\[|$) ]]; then
      nm="${BASH_REMATCH[1]}"
      _var_get "$nm" && _var_poison "$nm"
    elif [[ "$wd" == -* ]]; then
      # Attached option argument naming a variable: printf -vD, read -aD,
      # wait -pD. Only those letters take a name, so `ls -la "$a"` leaves a alone.
      for ((i = 0; i < ${#VAR_K[@]}; i++)); do
        nm="${VAR_K[i]}"
        [[ -n "$nm" && "$wd" =~ ^-[A-Za-z]*[vap]$nm$ ]] && _var_poison "$nm"
      done
    fi
  done
  return 0
}

IC_CHILD=0    # the command being inspected certainly runs in a child shell
_var_clear_all() { # forget every binding and bind nothing more on this line
  local i
  for ((i = 0; i < ${#VAR_K[@]}; i++)); do
    [[ -n "${VAR_K[i]}" ]] && { _var_is_danger "${VAR_K[i]}" || VAR_D+=("${VAR_K[i]}"); }
  done
  VAR_K=(); VAR_V=(); LINE_CTRL=1
  # A child shell's HOME / OLDPWD / DIRSTACK changes stay there.
  (( IC_CHILD )) || { HOME_TAINT=1; OLDPWD_TAINT=1; DIRSTK_TAINT=1; }
}

_assign() { # $1 NAME=value word, $2 mode
  case "$2" in
    bind)   _var_set "${1%%=*}" "${1#*=}" ;;
    poison) _var_poison "${1%%=*}" "${1#*=}" ;;
  esac
}

_subst_vars() { # $1 string -> RET with known $NAME / ${NAME} substituted
  local s="$1" out="" name pre whole post
  # `set -- <main>` makes $1 / $@ / ${1} point into a main checkout.
  local posre='\$\{?[0-9@*]'
  if [[ "$POS_DANGER" == "1" && "$s" =~ $posre ]]; then RETDANGER=1; fi
  # Extended forms (${D%/}, ${D/x/y}, ${#D}, ${!D}, ${D:-x}) are not resolved;
  # they can rewrite a bound path anywhere, so one over a bound or DANGER name
  # is DANGER (blocks wherever the command runs).
  local ext='\$\{([#!]?)([A-Za-z_][A-Za-z0-9_]*)([^A-Za-z0-9_}][^}]*)?\}(.*)$' rest="$s" en
  while [[ "$rest" =~ $ext ]]; do
    en="${BASH_REMATCH[2]}"
    if [[ -n "${BASH_REMATCH[1]}${BASH_REMATCH[3]}" ]]; then
      if _var_get "$en" || _var_is_danger "$en"; then RETDANGER=1; fi
    fi
    rest="${BASH_REMATCH[4]}"
  done
  local re='^([^$]*)\$(\{([A-Za-z_][A-Za-z0-9_]*)\}|([A-Za-z_][A-Za-z0-9_]*))(.*)$'
  while [[ "$s" =~ $re ]]; do
    name="${BASH_REMATCH[3]}${BASH_REMATCH[4]}"
    pre="${BASH_REMATCH[1]}" whole="\$${BASH_REMATCH[2]}" post="${BASH_REMATCH[5]}"
    if _var_get "$name"; then
      out="$out$pre$RET"
    elif [[ "$name" == HOME ]] && _home; then
      out="$out$pre$RET"
    else
      _var_is_danger "$name" && RETDANGER=1
      out="$out$pre$whole"
    fi
    s="$post"
  done
  RET="$out$s"
}

_abs_path() { # $1 path, $2 base dir -> RET absolute (unresolvable vars flagged)
  _expand_path "$1"
  local p="$RET"
  [[ "$p" != /* ]] && p="$2/$p"
  RET="$p"
}

_nearest_dir() { # $1 absolute path -> RET nearest existing ancestor directory
  local p="$1" q
  while [[ -n "$p" && ! -d "$p" ]]; do
    q="${p%/*}"
    [[ "$q" == "$p" ]] && { p=""; break; }   # no slash left: never loop
    p="$q"
  done
  [[ -z "$p" ]] && p="/"
  RET="$p"
}

# Cache of dir -> 1 (main checkout) / 0 (not), as two parallel arrays.
MC_KEYS=()
MC_VALS=()

_is_main_checkout() { # $1 dir -> 0 when it is a MAIN checkout
  local d="$1" i gd
  for ((i = 0; i < ${#MC_KEYS[@]}; i++)); do
    if [[ "${MC_KEYS[i]}" == "$d" ]]; then
      [[ "${MC_VALS[i]}" == "1" ]] && return 0
      return 1
    fi
  done
  local val=0
  # Physically, as the kernel resolves a write's path: <dir>/link/../f is in
  # link's target's parent. (The modelled cwd is kept logical-normalised, so
  # resolving it physically finds the directory bash is really in.)
  gd=$(cd -P "$d" 2>/dev/null && git rev-parse --git-dir 2>/dev/null)
  if [[ -n "$gd" ]]; then
    if [[ "$gd" != /* ]]; then
      gd=$(cd -P "$d" 2>/dev/null && cd -P "$gd" 2>/dev/null && pwd -P)
    fi
    if [[ -n "$gd" && "$gd" != *".git/worktrees/"* ]]; then
      val=1
    fi
  fi
  MC_KEYS+=("$d")
  MC_VALS+=("$val")
  [[ "$val" == "1" ]] && return 0
  return 1
}

_dir_is_main() { # $1 dir-ish path (may not exist) -> 0 when in a main checkout
  _nearest_dir "$1"
  _is_main_checkout "$RET"
}

# --- verdict ----------------------------------------------------------------

BLOCKED=0
BLOCK_WHAT=""
BLOCK_WHERE=""
BLOCK_KIND=""

_block() { # $1 what, $2 where, [$3 kind: nonliteral]
  [[ "$BLOCKED" == "1" ]] && return 0
  BLOCKED=1
  BLOCK_KIND="${3:-}"
  _shown "$1"; BLOCK_WHAT="$RET"
  BLOCK_WHERE="$2"
}

_shown() { # $1 text -> RET with the lexer's placeholders written back as shell text
  local s="$1" lit='\$'
  s="${s//"$LITD"/$lit}"; s="${s//"$QLOST"/…}"; s="${s//"$QMARK"/}"; s="${s//"$QTILDE"/\\}"
  RET="${s//"$CMDSUB"/\$(…)}"
}

# --- lexer state ------------------------------------------------------------

LINES=()
L=0
C=0
HD=()            # pending heredoc delimiters for the current line
# Working directory as tracked through `cd`, plus a flag for a `cd` target we
# could not resolve. Both are globals because _inspect_cmd — reached from deep
# inside the lexer — has to update them.
#
# A `cd` inside a SUBSHELL (`$( … )`, backticks, or `( … )`) cannot move the
# PARENT shell's working directory. _lex_context therefore saves this pair on
# entering a subshell context and restores it on leaving. Do not "simplify" that
# away: without it `OUT="$(cd /elsewhere && …)"` would leave CURDIR pointing at
# /elsewhere for the rest of the command line, and every later relative path
# would be judged against the wrong repo.
CURDIR="$PWD"
DIR_UNRESOLVED=0
DIR_DANGER=0     # the unresolved cd target was a DANGER variable
DIR_WHY=""       # why the directory is unresolved (for the block message)
# A `cd` whose target does not exist fails in bash, leaving the shell where it
# was. DIR_ALT is that earlier directory; ALT_GUARD=1 while the commands being
# inspected run only if the cd succeeded (`cd X && …`). OLD_CUR is what `cd -`
# returns to, DIRSTK what `popd` pops ("?" for an unknown directory).
DIR_ALT=""
ALT_GUARD=0
OLD_CUR=""
DIRSTK=()
PARSE_ERROR=0
DEPTH=0
STEPS=0
MAXSTEPS=400000

# Runs of "ordinary" characters are consumed in one go rather than one at a
# time — a long single-line command (an 8 KB `gh pr create --body …`) is
# otherwise quadratic in bash and takes seconds.
LX_SPECIALS=$'\\\'"`$#;|&()<> \t'
ORDRUN_RE="^([^${LX_SPECIALS}]*)"
DQRUN_RE=$'^([^"\\\\$`]*)'

_split_lines() {
  LINES=()
  local line
  while IFS= read -r line; do
    LINES+=("$line")
  done <<< "$1"
}

# Read a single-quoted string starting at C (just past the opening quote).
_read_sq() {
  local out="" line rest part
  while :; do
    if (( L >= ${#LINES[@]} )); then PARSE_ERROR=1; RET="$out"; return; fi
    line="${LINES[L]}"
    rest="${line:C}"
    if [[ "$rest" == *"'"* ]]; then
      part="${rest%%\'*}"
      out="$out$part"; C=$((C + ${#part} + 1))
      RET="$out"; return
    fi
    out="$out$rest"$'\n'
    L=$((L + 1)); C=0
  done
}

# Read a double-quoted string starting at C (just past the opening quote).
# Command substitutions inside it are lexed (their commands ARE inspected) but
# contribute nothing to the literal value.
_read_dq() {
  local out="" line ch nx rest run
  while :; do
    if (( L >= ${#LINES[@]} )); then PARSE_ERROR=1; RET="$out"; return; fi
    line="${LINES[L]}"
    while (( C < ${#line} )); do
      rest="${line:C}"
      if [[ "$rest" =~ $DQRUN_RE ]]; then
        run="${BASH_REMATCH[1]}"
        if [[ -n "$run" ]]; then
          out="$out$run"; C=$((C + ${#run})); continue
        fi
      fi
      ch="${line:C:1}"
      if [[ "$ch" == '\' ]]; then
        nx="${line:$((C + 1)):1}"
        if [[ -z "$nx" ]]; then
          C=$((C + 1)); break            # line continuation
        fi
        case "$nx" in
          '$')
            # A literal $ — except inside backticks, which strip the backslash
            # before the inner command is parsed (so it expands there).
            if (( BQ > 0 )); then out="$out$nx"; else out="$out$LITD"; fi
            C=$((C + 2)); continue ;;
          '"'|'\'|'`') out="$out$nx"; C=$((C + 2)); continue ;;
          *)           out="$out$ch"; C=$((C + 1)); continue ;;
        esac
      fi
      if [[ "$ch" == '"' ]]; then C=$((C + 1)); RET="$out"; return; fi
      if [[ "$ch" == '$' && "${line:$((C + 1)):1}" == '(' ]]; then
        local dq_arith=0; [[ "${line:$((C + 2)):1}" == '(' ]] && dq_arith=1
        C=$((C + 2)); _lex_context ')'; line="${LINES[L]}"; out="$out$CMDSUB"
        (( dq_arith )) && _var_clear_all
        continue
      fi
      if [[ "$ch" == '`' ]]; then
        C=$((C + 1)); BQ=$((BQ + 1)); _lex_context '`'; BQ=$((BQ - 1))
        line="${LINES[L]}"; out="$out$CMDSUB"; continue
      fi
      out="$out$ch"; C=$((C + 1))
    done
    if (( C >= ${#line} )); then
      out="$out"$'\n'
      L=$((L + 1)); C=0
    fi
  done
}

# Read a $'…' string starting at C (just past the opening quote). Unlike '…',
# a backslash escapes the quote ($'it\'s'). Simple escapes are decoded; at the
# first one that is not (\x41, \u…, octal, \cX) the rest of the string is
# lost (QLOST). The result always ends in QMARK, so as a path it stays
# unresolvable: only its literal start can be judged.
_read_ansi() {
  local out="" lost=0 line ch nx
  while :; do
    if (( L >= ${#LINES[@]} )); then PARSE_ERROR=1; break; fi
    line="${LINES[L]}"
    while (( C < ${#line} )); do
      ch="${line:C:1}"
      if [[ "$ch" == "'" ]]; then
        C=$((C + 1))
        out="${out//\$/$LITD}"
        if (( lost )); then RET="$out$QLOST$QMARK"; else RET="$out$QMARK"; fi
        return
      fi
      if [[ "$ch" == '\' ]]; then
        nx="${line:$((C + 1)):1}"
        C=$((C + 2))
        (( lost )) && continue
        case "$nx" in
          "'"|'"'|'\'|'?') out="$out$nx" ;;
          n) out="$out"$'\n' ;;
          t) out="$out"$'\t' ;;
          r) out="$out"$'\r' ;;
          a) out="$out"$'\a' ;;
          b) out="$out"$'\b' ;;
          e|E) out="$out"$'\033' ;;
          f) out="$out"$'\f' ;;
          v) out="$out"$'\v' ;;
          '') C=$((C - 1)); lost=1 ;;        # backslash at end of line
          *) lost=1 ;;
        esac
        continue
      fi
      (( lost )) || out="$out$ch"
      C=$((C + 1))
    done
    (( lost )) || out="$out"$'\n'
    L=$((L + 1)); C=0
  done
  out="${out//\$/$LITD}"
  RET="$out$QLOST$QMARK"
}

# Read a heredoc delimiter word starting at C; push it onto HD.
_read_heredoc_delim() {
  local line="${LINES[L]}" ch delim="" q quoted=0
  while [[ "${line:C:1}" == " " || "${line:C:1}" == $'\t' ]]; do C=$((C + 1)); done
  while (( C < ${#line} )); do
    ch="${line:C:1}"
    case "$ch" in
      "'"|'"')
        q="$ch"; quoted=1; C=$((C + 1))
        while (( C < ${#line} )) && [[ "${line:C:1}" != "$q" ]]; do
          delim="$delim${line:C:1}"; C=$((C + 1))
        done
        C=$((C + 1))
        ;;
      '\')
        quoted=1; C=$((C + 1)); delim="$delim${line:C:1}"; C=$((C + 1))
        ;;
      ' '|$'\t'|';'|'&'|'|'|')'|'<'|'>')
        break
        ;;
      *)
        delim="$delim$ch"; C=$((C + 1))
        ;;
    esac
  done
  if [[ -n "$delim" ]]; then
    if (( quoted )); then HD+=("Q$delim"); else HD+=("U$delim"); fi
  fi
}

# At end of a line that opened heredocs: swallow their bodies.
_consume_heredocs() {
  local i=$((L + 1)) entry d kind ln trimmed esc
  local n=${#LINES[@]}
  local -a pending=("${HD[@]}") bodies=()
  for entry in "${pending[@]}"; do
    kind="${entry:0:1}"; d="${entry:1}"
    while (( i < n )); do
      ln="${LINES[i]}"
      trimmed="$ln"
      while [[ "$trimmed" == $'\t'* ]]; do trimmed="${trimmed#	}"; done
      i=$((i + 1))
      if [[ "$ln" == "$d" || "$trimmed" == "$d" ]]; then break; fi
      # An UNQUOTED delimiter means the body expands: $(…) and `…` in it RUN.
  # (_end_word keeps here-strings and input redirections for the same reason.)
      # Queue those lines to be lexed like a double-quoted string.
      # ${D:=…} in such a body assigns D, so those lines are lexed too.
      if [[ "$kind" == "U" && ( "$ln" == *'$('* || "$ln" == *'`'* || "$ln" == *'${'* ) ]]; then
        bodies+=("$ln")
      fi
    done
  done
  HD=()
  L=$((i - 1))
  for ln in "${bodies[@]}"; do
    # a heredoc body treats \$ \` \\ like a double-quoted string does, so only the
    # double quote itself needs escaping to lex the line as one
    esc="${ln//\"/\\\"}"
    _analyze_text ": \"$esc\""
  done
}

# --- command inspection -----------------------------------------------------

IC_WORDS=()
IC_REDIRS=()
IC_OTHER=()      # input redirection targets (`< file`): read, but still expanded
IC_HSTR=()       # here-string words (`<<< word`)
IC_WQ=()         # per word: 1 when quoted before its first `=` (not an assignment)

# Stands in for a $(…) / `…` inside a word. Its value is only known at run time,
# so the word must read as unresolvable (it contains a '$'), never as the empty
# string it would otherwise collapse to.
CMDSUB='${__command_substitution__}'

# Check one write destination; block when it lands inside a main checkout.
_check_dest() { # $1 destination, $2 kind: redir | remote | (empty: a file argument)
  local raw="$1" kind="${2:-}"
  [[ -z "$raw" ]] && return 0
  case "$raw" in
    /dev/null|/dev/stdout|/dev/stderr|/dev/tty|/dev/fd/*) return 0 ;;
  esac
  if [[ "$kind" == "redir" ]]; then
    [[ "$raw" == '&'* ]] && return 0          # >&2, 2>&1: an fd, not a file
    [[ "$raw" =~ ^[0-9]+$ ]] && return 0      # fd number left over from N>&M
  fi
  _check_literal "$raw" && return 0
  if [[ "$kind" == "remote" && "$raw" =~ ^[^/]*: ]]; then
    return 0                                  # host:path — not this machine
  fi
  _expand_path "$raw"
  if [[ "$RETDANGER" == "1" ]]; then
    _block "write to '$raw', whose variable may point into a main checkout" "$CURDIR"
    return 0
  fi
  # After a cd this guard cannot resolve, the working directory is unknown: a
  # destination that is (or may be) relative blocks wherever the line runs.
  # One that resolves to an absolute or ~ path does not depend on it.
  # ('~x' quoted, or ~user that does not resolve, is a relative name: only an
  # absolute destination is independent of the working directory.)
  if [[ "$DIR_UNRESOLVED" == "1" ]]; then
    case "$RET" in
      /*) ;;
      *) _block "relative write to '$raw' after $DIR_WHY" "$CURDIR" unresolved
         return 0 ;;
    esac
  fi
  # Judge every reading of the word (defaults like ${D:-<main>} included),
  # against the working directory and, after a cd that may have failed,
  # against the directory the shell may still be in.
  local -a alts bases
  local a b
  _alt_candidates "$raw"; alts=("${ALTS[@]}")
  bases=("$CURDIR"); _alt_active && bases+=("$DIR_ALT")
  for a in "${alts[@]}"; do
    for b in "${bases[@]}"; do
      _dest_risk "$a" "$b"
      case "$RET" in
        danger)
          _block "write to '$raw', whose variable may point into a main checkout" "$CURDIR"
          return 0 ;;
        main)
          if [[ "$b" == "$CURDIR" ]]; then
            _block "write to '$raw'$RETWHY" "$RETP"
          else
            _block "write to '$raw' after a cd that may have failed (its target does not exist)$RETWHY" "$RETP"
          fi
          return 0 ;;
      esac
    done
  done
  # An unresolvable reading is only a risk from a main checkout, where
  # _check_literal has already blocked it.
  return 0
}

_block_if_cwd_main() { # $1 what — a content-introducing command run in CWD
  local what="$1"
  (( TILDE_CD )) && TILDE_SEEN=1
  if [[ "$DIR_UNRESOLVED" == "1" ]]; then
    _block "$what after $DIR_WHY" "$CURDIR" unresolved
    return 0
  fi
  if _dir_is_main "$CURDIR"; then
    _block "$what" "$CURDIR"
  elif _alt_active && _dir_is_main "$DIR_ALT"; then
    _block "$what (after a cd that may have failed: its target does not exist)" "$DIR_ALT"
  fi
}

# The working directory is now unknown (a cd this guard cannot follow). The
# cd may have failed, leaving OLDPWD as it was, so `cd -` returns to a known
# directory only when both outcomes agree.
_dir_unknown() { # $1 why
  local old="$CURDIR"
  CD_COUNT=$((CD_COUNT + 1))
  if [[ "$DIR_UNRESOLVED" == "1" || "$OLD_CUR" != "$old" ]]; then OLD_CUR="?"; fi
  DIR_UNRESOLVED=1; DIR_DANGER=1; DIR_WHY="$1"
  return 0
}

# After && / || or inside if / while / until / for / select / case (or a
# { … } group entered after && / ||), a directory change may not run at all.
_cd_maybe() { [[ "$NEXT_COND" == "1" ]] || (( CTRL_DEPTH > 0 )); }

_fn_dir() { # a function / alias / enable / set -r may have redefined cd
  DIR_UNRESOLVED=1; DIR_DANGER=1
  DIR_WHY="a function, alias, enable or set -r (cd may no longer be the builtin)"
}

# Remember a directory the shell may still be in. There is one slot: when two
# candidates compete, keep a main checkout (fail closed).
_alt_add() { # $1 directory
  if [[ -z "$DIR_ALT" ]]; then DIR_ALT="$1"
  elif [[ "$DIR_ALT" != "$1" ]] && ! _dir_is_main "$DIR_ALT" && _dir_is_main "$1"; then DIR_ALT="$1"
  fi
  return 0
}

# A compound command (if / while / for / case / select / { … }) that is a
# pipeline member or a background job runs in a child shell (at the END of a
# pipeline it may instead run in this shell: lastpipe; always in zsh / ksh).
# Inside it, a cd or assignment applies to the rest of its body. When it
# closes, nothing is restored (a misread closer must never undo a real cd):
# if it changed directory, the directory is unknown, and bindings it changed
# are no longer trusted. The state it opened with is saved for that check.
FS1=$'\x1e'; FS2=$'\x1f'
_join() { # $@ -> RET: each element prefixed by FS2 (keeps empty elements)
  local out="" e
  for e in "$@"; do out="$out$FS2$e"; done
  RET="$out"
}
_split() { # $1 _join output -> SPLIT
  SPLIT=()
  local s="$1"
  [[ -z "$s" ]] && return 0
  s="${s#"$FS2"}"
  while [[ "$s" == *"$FS2"* ]]; do SPLIT+=("${s%%"$FS2"*}"); s="${s#*"$FS2"}"; done
  SPLIT+=("$s")
}
SPLIT=()
_ctrl_open() { # $1 kind: if | loop | case | brace
  local c=0 snap stk vk vv at
  # Only the outermost compound this command opens is the pipeline member:
  # in `true | { if …`, the if runs inside the group's child shell.
  [[ "$NEXT_PIPE" == "1" && "$IC_OPENED" == 0 ]] && c=1
  _join "${DIRSTK[@]}"; stk="$RET"
  _join "${VAR_K[@]}"; vk="$RET"
  _join "${VAR_V[@]}"; vv="$RET"
  _join "${ATTR_N[@]}"; at="$RET"
  snap="$CURDIR$FS1$DIR_UNRESOLVED$FS1$DIR_DANGER$FS1$DIR_WHY$FS1$DIR_ALT$FS1$ALT_GUARD$FS1$OLD_CUR$FS1$TILDE_CD$FS1$stk$FS1$vk$FS1$vv$FS1$CD_COUNT$FS1$DIRSTK_TAINT$FS1$OLDPWD_TAINT$FS1$at"
  CTRL_STK+=("$c:$1"); CTRL_SNAP+=("$snap")
}
# Only a closer that matches the innermost open compound closes it (fi an if,
# done a loop, esac a case, } a group); anything else is not a closer here
# (a case pattern such as `fi|y)`, a stray word). RET: the entry closed.
_ctrl_close() { # $1 kind -> 1 when it closes nothing
  local n=${#CTRL_STK[@]} c snap ent
  RET=""
  (( n == 0 )) && return 1
  ent="${CTRL_STK[$((n - 1))]}"
  [[ "${ent#*:}" == "$1" || "${ent#*:}" == "$1":* ]] || return 1
  RET="$ent"
  c="${ent%%:*}"; snap="${CTRL_SNAP[$((n - 1))]}"
  unset "CTRL_STK[$((n - 1))]" "CTRL_SNAP[$((n - 1))]"
  CTRL_STK=("${CTRL_STK[@]}"); CTRL_SNAP=("${CTRL_SNAP[@]}")
  [[ "$c" == 1 || "$LX_TERM" == pipe || "$LX_TERM" == bg ]] || return 0
  # It ran in a child shell (before a `|` or `&`), or may have (at the end of
  # a pipeline). Its changes are never undone: a misread closer must not make
  # this guard surer of anything. A directory change inside it leaves the
  # directory, OLDPWD and the stack unknown; a binding it changed is no
  # longer trusted.
  local -a f=()
  local rest="$snap$FS1"
  while [[ -n "$rest" ]]; do f+=("${rest%%"$FS1"*}"); rest="${rest#*"$FS1"}"; done
  if [[ "$CD_COUNT" != "${f[11]}" ]]; then
    _dir_lost "a cd inside a compound command in a pipeline or background job"
  fi
  local -a ok ov
  local k nm same
  _split "${f[9]}"; ok=("${SPLIT[@]}")
  _split "${f[10]}"; ov=("${SPLIT[@]}")
  for nm in "${VAR_K[@]}" "${ok[@]}"; do
    [[ -n "$nm" ]] || continue
    same=0
    for ((k = ${#ok[@]} - 1; k >= 0; k--)); do
      if [[ "${ok[k]}" == "$nm" ]]; then
        _var_get "$nm" && [[ "$RET" == "${ov[k]}" ]] && same=1
        break
      fi
    done
    (( same )) && continue
    _var_is_danger "$nm" || VAR_D+=("$nm")
    _forget "$nm"
  done
  return 0
}

# Something that may run any number of cd / pushd / popd (a sourced file, a
# command named by an expansion, a trap handler, a function, a compound or eval
# at the end of a pipeline): the directory, OLDPWD and the stack are all lost.
_dir_lost() { # $1 why
  _dir_unknown "$1"
  OLD_CUR="?"; DIRSTK_TAINT=1
  return 0
}

# A logical cd (the default, -L) drops . and .. textually before following
# symlinks: /repo/link/.. is /repo, whatever link points to.
_lexnorm() { # $1 absolute path -> RET
  local -a parts=() out=()
  local part n rest="$1/"
  # Split on / by hand: read would stop at a newline inside a name.
  while [[ -n "$rest" ]]; do parts+=("${rest%%/*}"); rest="${rest#*/}"; done
  for part in "${parts[@]}"; do
    case "$part" in
      ''|.) ;;
      ..) n=${#out[@]}; (( n > 0 )) && unset "out[$((n - 1))]"; out=("${out[@]}") ;;
      *) out+=("$part") ;;
    esac
  done
  RET=""
  for part in "${out[@]}"; do RET="$RET/$part"; done
  [[ -z "$RET" ]] && RET=/
  return 0
}

# Remember a directory mkdir / git worktree add makes. . and // are dropped
# (exact); a path with .. is not recorded at all: the kernel resolves .. through
# symlinks (mkdir -p <x>/link/../new makes it beside link's target), so a later
# cd to its lexical spelling stays a cd that may fail.
_record_created() { # $1 absolute path
  case "$1/" in */../*) return 0 ;; esac
  _lexnorm "$1"; CREATED+=("$RET")
  return 0
}

# The physical directory a path resolves to (RET; empty when it does not).
# A sentinel keeps trailing newlines that $(…) would strip from a name.
_phys() { # $1 path, $2 L to resolve it logically first
  local opt=-P
  [[ "${2:-}" == L ]] && opt=-L
  RET=$(cd "$opt" -- "$1" 2>/dev/null && pwd -P && echo .) || { RET=""; return 0; }
  RET="${RET%.}"; RET="${RET%$'\n'}"
  return 0
}

# A logical cd succeeds only if every prefix before a .., normalised, is a
# directory (bash's check), or was made by mkdir / git worktree add on this line.
_walk_ok() { # $1 absolute path as written
  local rest="$1/" comp cur=""
  while [[ -n "$rest" ]]; do
    comp="${rest%%/*}"; rest="${rest#*/}"
    if [[ "$comp" == .. ]]; then
      _lexnorm "${cur:-/}"
      [[ -d "$RET" ]] || _was_created "$RET" || return 1
    fi
    [[ -n "$comp" ]] && cur="$cur/$comp"
  done
  return 0
}

# Change the modelled working directory the way `cd <target>` / `pushd <target>`
# would. The caller has already refused computed targets (_dir_unknown).
_cd_to() { # $1 target word (literal), $2 L / P (cd -L / -P) or empty
  local mode="${2:-}" target="$1" old="$CURDIR" oldun="$DIR_UNRESOLVED" olddg="$DIR_DANGER" prevold="$OLD_CUR"
  CD_COUNT=$((CD_COUNT + 1))
  local e unres p viacdp="" cdp known ent maybe=0
  local -a ents
  if _nonliteral "$target"; then _dir_unknown "cd '$target'"; return 0; fi
  local tcd=0
  case "$target" in '~'|'~/'*) tcd=1 ;; esac
  _expand_path "$target"; e="$RET"; unres="$RETUNRES"
  # After && / || or inside if / while / until / for / select / case, the cd
  # may not run at all: the shell may still be where it was (like a cd that
  # fails). A { … } group always runs.
  _cd_maybe && maybe=1
  # A relative target from a directory that is already unknown stays unknown,
  # and so does any cd from there that may not run.
  if [[ "$oldun" == "1" ]] && (( maybe )) || [[ "$oldun" == "1" && "$e" != /* ]]; then
    OLD_CUR="?"
    (( tcd )) && { TILDE_CD=1; TILDE_CD_EVER=1; }
    return 0
  fi
  # CDPATH applies to a relative target that does not start with . or ..
  if [[ "$unres" == "0" && "$e" != /* && "$e" != . && "$e" != .. && "$e" != ./* && "$e" != ../* ]]; then
    known=1; cdp=""
    if _var_get CDPATH; then cdp="$RET"
    elif [[ "$CDPATH_TAINT" == "1" ]] || _var_is_danger CDPATH; then known=0
    else cdp="${CDPATH:-}"
    fi
    if (( ! known )); then
      _dir_unknown "cd '$target' (CDPATH may have changed on this line)"; return 0
    elif [[ -n "$cdp" ]]; then
      # Split on : by hand (read would stop at a newline inside an entry).
      local crest="$cdp:"; ents=()
      while [[ -n "$crest" ]]; do ents+=("${crest%%:*}"); crest="${crest#*:}"; done
      for ent in "${ents[@]}"; do
        [[ -z "$ent" ]] && ent="$CURDIR"
        [[ "$ent" != /* ]] && ent="$CURDIR/$ent"
        if [[ -d "$ent/$e" ]]; then viacdp="$ent/$e"; break; fi
      done
    fi
  fi
  if [[ "$unres" == "1" ]]; then _dir_unknown "cd '$target'"; return 0; fi
  if [[ -n "$viacdp" ]]; then p="$viacdp"; else p="$e"; [[ "$p" != /* ]] && p="$CURDIR/$p"; fi
  # p as written (a physical cd resolves its .. through symlinks); plog the
  # logical result (.. dropped textually, as cd -L does). CURDIR is always
  # kept logical-normalised, so either reading starts from the right place.
  local praw="$p" plog
  _lexnorm "$p"; plog="$RET"; p="$plog"
  # cd -P (or physical mode) resolves .. through symlinks: <wt>/link/.. may be
  # in another checkout. With physical mode merely possible, a target whose
  # logical and physical readings differ is not followed.
  if [[ "$mode" == P ]] || { [[ "$mode" != L && "$PHYS" == 1 ]]; }; then
    local pq lq
    _phys "$praw"; pq="$RET"
    if [[ "$mode" == P ]]; then
      [[ -n "$pq" ]] && p="$pq"
    else
      _phys "$plog" L; lq="$RET"
      if [[ "$pq" != "$lq" ]]; then
        _dir_unknown "cd '$target' (physical mode may resolve it elsewhere)"; return 0
      fi
    fi
  fi
  # Whether the cd succeeds, and where it lands, the way bash decides:
  # - cd -P: the target as written, resolved physically (p is already that);
  # - cd -L (default): logically when every normalised prefix before a .. is
  #   a directory and the normalised result is one; otherwise bash falls
  #   back to chdir() on the target as written, which the kernel resolves
  #   physically (cd -L <x>/link/../foo/.. can land beside link's target);
  # - otherwise it fails (cd <x>/missing/..), unless mkdir / git worktree add
  #   made the directories on this line.
  local reach=0
  if [[ "$mode" == P ]]; then
    if [[ -d "$praw" ]] || _was_created "$p"; then reach=1; fi
  elif _walk_ok "$praw" && { [[ -d "$p" ]] || _was_created "$p"; }; then
    reach=1
  elif [[ -d "$praw" ]]; then
    _phys "$praw"; [[ -n "$RET" ]] && { p="$RET"; reach=1; }
  fi
  if (( ! maybe && reach )); then
    _nearest_dir "$p"; CURDIR="$RET"; DIR_UNRESOLVED=0; DIR_DANGER=0; DIR_WHY=""
    # Only an absolute target settles where we are; a relative one may be
    # relative to DIR_ALT. Settling also ends a dependency on an earlier cd ~
    # (a cd that may fail does not).
    [[ "$e" == /* ]] && { DIR_ALT=""; TILDE_CD=0; }
    if [[ "$oldun" == "1" ]]; then OLD_CUR="?"; else OLD_CUR="$old"; fi
  else
    # bash's cd fails here unless something this guard does not model creates
    # the directory first (or it may not run); the shell may then still be
    # where it was, and OLDPWD keeps its earlier value.
    _alt_add "$old"
    ALT_GUARD=0; [[ "$LX_TERM" == and ]] && ALT_GUARD=1
    _nearest_dir "$p"; CURDIR="$RET"
    DIR_UNRESOLVED="$oldun"; DIR_DANGER="$olddg"
    if [[ "$oldun" == "1" || "$prevold" != "$old" ]]; then OLD_CUR="?"; else OLD_CUR="$old"; fi
  fi
  (( FN_SEEN )) && _fn_dir
  (( tcd )) && { TILDE_CD=1; TILDE_CD_EVER=1; }
  return 0
}

# Return to a directory the line visited earlier (`cd -`, `popd`). The old
# model ignored these, so a main checkout we are leaving stays a possibility.
_cd_back() { # $1 directory, or "?" when unknown
  local old="$CURDIR" oldun="$DIR_UNRESOLVED"
  CD_COUNT=$((CD_COUNT + 1))
  if _cd_maybe; then
    # It may not run: from an unknown directory we stay unknown; otherwise the
    # shell may still be here, and OLDPWD / the stack are no longer certain.
    OLD_CUR="?"; DIRSTK_TAINT=1
    (( TILDE_CD_EVER )) && TILDE_CD=1
    [[ "$oldun" == "1" ]] && return 0
    if [[ "$1" == "?" || -z "$1" ]]; then
      DIR_UNRESOLVED=1; DIR_DANGER=1
      DIR_WHY="cd - / pushd / popd to a directory this guard cannot tell"
    else
      _alt_add "$old"; ALT_GUARD=0; [[ "$LX_TERM" == and ]] && ALT_GUARD=1
      CURDIR="$1"
    fi
    (( FN_SEEN )) && _fn_dir
    return 0
  fi
  # The directory returned to may be one a cd ~ reached (not tracked per entry).
  (( TILDE_CD_EVER )) && TILDE_CD=1
  if [[ "$1" == "?" || -z "$1" ]]; then
    DIR_UNRESOLVED=1; DIR_DANGER=1
    DIR_WHY="cd - / pushd / popd to a directory this guard cannot tell"
  else
    CURDIR="$1"; DIR_UNRESOLVED=0; DIR_DANGER=0; DIR_WHY=""
    if _dir_is_main "$old"; then _alt_add "$old"; ALT_GUARD=0; fi
  fi
  (( FN_SEEN )) && _fn_dir
  if [[ "$oldun" == "1" ]]; then OLD_CUR="?"; else OLD_CUR="$old"; fi
  return 0
}

_has_inplace_flag() { # $@ args -> 0 when a sed/perl in-place flag is present
  local a
  for a in "$@"; do
    case "$a" in
      --in-place*) return 0 ;;
      --) return 1 ;;
      -*) [[ "$a" =~ ^-[A-Za-z]*i ]] && return 0 ;;
    esac
  done
  return 1
}

_last_nonflag() { # $@ -> RET last non-option argument, RETCOUNT how many there were
  local a last=""
  RETCOUNT=0
  for a in "$@"; do
    case "$a" in -*) ;; *) last="$a"; RETCOUNT=$((RETCOUNT + 1)) ;; esac
  done
  RET="$last"
}

_inspect_cmd() {
  local -a w
  local -a r o h
  w=("${IC_WORDS[@]}")
  r=("${IC_REDIRS[@]}")
  o=("${IC_OTHER[@]}")
  h=("${IC_HSTR[@]}")
  local -a wq
  wq=("${IC_WQ[@]}")
  local n=${#w[@]}
  local i=0 x base t j a prefixed=0 extprefix=0 mode kwok=1 iskw=0
  IC_OPENED=0

  # ${D:=…} / ${D=…} anywhere in the command assign D before anything is judged.
  _scan_default_assigns "${r[@]}" "${o[@]}" "${h[@]}" "${w[@]}"

  # Redirection targets are writes wherever the command runs.
  for t in "${r[@]}"; do
    _check_dest "$t" redir
  done

  (( n == 0 )) && return 0

  # Shell-state taints a mention sets; put back below if the command turns out
  # to run in a child (before a | or &, after env / sudo / …).
  local sv_opt="$OLDPWD_TAINT" sv_dst="$DIRSTK_TAINT" sv_cdp="$CDPATH_TAINT" sv_home="$HOME_TAINT" sv_sot="$SHOPTS_TAINT"
  _poison_mentions "${w[@]}"

  # Strip variable assignments and command prefixes (env, sudo, xargs, …).
  while (( i < n )); do
    x="${w[i]}"
    # In a shell assignment position a quoted "D=x" is the command name (bash
    # looks up a command "D=x"); D keeps its value, though _poison_mentions has
    # already stopped trusting it. After env / sudo / …, quoting does not
    # matter: env "D=x" cmd still sets D and runs cmd.
    # NAME=…, NAME+=…, NAME[i]=… are all assignment words.
    if [[ "$x" =~ ^[A-Za-z_][A-Za-z0-9_]*(\[[^]]*\])?\+?= ]] && { (( prefixed )) || [[ "${wq[i]:-0}" != 1 ]]; }; then
      kwok=0; i=$((i + 1)); continue
    fi
    base="${x##*/}"
    # A reserved word is one only when unquoted, without a path, and first in
    # the command (after ! or time, or another reserved word): "if", \fi,
    # `command if` and `D=1 if` are ordinary command names.
    iskw=0
    [[ "$kwok" == 1 && "${wq[i]:-0}" != 1 && "$x" == "$base" ]] && iskw=1
    case "$base" in
      then|do|else|elif|if|while|until|'{'|'}')
        (( iskw )) || break
        case "$base" in
          if) CTRL_DEPTH=$((CTRL_DEPTH + 1)); _ctrl_open if; IC_OPENED=1 ;;
          while|until) CTRL_DEPTH=$((CTRL_DEPTH + 1)); _ctrl_open loop; IC_OPENED=1 ;;
          '{')
            # After && / ||, the whole group may not run, not just its first command.
            if [[ "$NEXT_COND" == "1" && "$IC_OPENED" == 0 ]]; then
              CTRL_DEPTH=$((CTRL_DEPTH + 1)); _ctrl_open brace; CTRL_STK[${#CTRL_STK[@]}-1]+=":d"
            else
              _ctrl_open brace
            fi
            IC_OPENED=1 ;;
          '}')
            if _ctrl_close brace && [[ "$RET" == *:d ]] && (( CTRL_DEPTH > 0 )); then
              CTRL_DEPTH=$((CTRL_DEPTH - 1))
            fi ;;
        esac
        LINE_CTRL=1; i=$((i + 1)); continue ;;
      env|sudo|doas|nohup|nice|ionice|stdbuf|setsid)
        # These run the command as a new process: a cd there moves nothing here.
        prefixed=1; extprefix=1; kwok=0; i=$((i + 1)); continue ;;
      time|'!'|'('|')')
        # The reserved words time and ! keep the next word in command position;
        # a quoted / pathed "time" is the program (a separate process), and a
        # quoted "!" is an ordinary command name.
        if (( iskw )) || [[ "$base" == '(' || "$base" == ')' ]]; then
          prefixed=1; i=$((i + 1)); continue
        fi
        if [[ "$base" == time ]]; then prefixed=1; extprefix=1; kwok=0; i=$((i + 1)); continue; fi
        break ;;
      command|builtin|exec)
        prefixed=1; kwok=0; i=$((i + 1)); continue ;;
      timeout)
        prefixed=1; extprefix=1; kwok=0; i=$((i + 1))
        while (( i < n )) && [[ "${w[i]}" == -* ]]; do i=$((i + 1)); done
        i=$((i + 1)); continue ;;
      xargs)
        prefixed=1; extprefix=1; kwok=0; i=$((i + 1))
        while (( i < n )) && [[ "${w[i]}" == -* ]]; do
          case "${w[i]}" in
            -n|-I|-P|-L|-s|-a|-d|-E) i=$((i + 2)) ;;
            *) i=$((i + 1)) ;;
          esac
        done
        continue ;;
    esac
    break
  done
  # A command made only of assignments sets them in this shell (see
  # _assign_mode). Prefix assignments (`X=1 cmd`, `env X=1`) are never bound:
  # bash expands the command's own words before X is set, and X does not
  # outlive the command.
  _assign_mode; mode="$RET"
  (( prefixed )) && mode=skip
  if (( i >= n )); then
    # Only assignments: in a child (before a | or &, or env X=…), none of
    # them, nor the taints their mention set, reach this shell.
    if [[ "$LX_TERM" == pipe || "$LX_TERM" == bg ]] || (( extprefix )); then
      OLDPWD_TAINT="$sv_opt"; DIRSTK_TAINT="$sv_dst"; CDPATH_TAINT="$sv_cdp"; HOME_TAINT="$sv_home"; SHOPTS_TAINT="$sv_sot"
    fi
    for ((j = 0; j < n; j++)); do
      [[ "${w[j]}" =~ ^[A-Za-z_][A-Za-z0-9_]*= ]] && _assign "${w[j]}" "$mode"
    done
    return 0
  fi

  local name="${w[i]}"
  base="${name##*/}"
  local -a args
  args=("${w[@]:$((i + 1))}")

  # With lastpipe, the last member of a pipeline runs in this shell.
  # child: certainly not this shell (a pipeline member before a `|`, a
  # background job, a separate program). lastm: a pipeline's last member,
  # which runs in this shell under lastpipe (always in zsh / ksh) and in a
  # child otherwise — not followed, so a cd there leaves the directory unknown.
  local child=0 lastm=0
  if [[ "$LX_TERM" == pipe || "$LX_TERM" == bg ]]; then child=1
  elif [[ "$NEXT_PIPE" == "1" && "$IC_OPENED" == 0 ]]; then lastm=1
  fi
  (( extprefix )) && child=1
  # A command name with a slash (/usr/bin/cd, $X/cd) is a program, not the
  # builtin: it cannot move this shell.
  [[ "$name" == */* ]] && child=1
  (( child )) && lastm=0
  if (( child )); then
    OLDPWD_TAINT="$sv_opt"; DIRSTK_TAINT="$sv_dst"; CDPATH_TAINT="$sv_cdp"; HOME_TAINT="$sv_home"; SHOPTS_TAINT="$sv_sot"
  fi
  IC_CHILD="$child"

  # Prefix assignments before a POSIX special builtin can persist in this
  # shell (`D=x export D`). Never bind them, but track their danger.
  case "$base" in
    export|readonly|eval|set|unset|shift|trap|exec|.|:|return|exit|break|continue|times)
      for ((j = 0; j < i; j++)); do
        [[ "${w[j]}" =~ ^[A-Za-z_][A-Za-z0-9_]*= ]] && _var_poison "${w[j]%%=*}" "${w[j]#*=}"
      done ;;
  esac

  # Builtins that write a variable no argument names (bash 3.2 has no ;;&).
  # A here-string gives read / mapfile a value we can see: judge the names it
  # fills against it (read -r D <<< <main>).
  if (( ${#h[@]} > 0 )); then
    case "$base" in
      read|mapfile|readarray)
        local -a rnames=()
        local hv first skipnext=0
        for ((j = 0; j < ${#args[@]}; j++)); do
          a="${args[j]}"
          if (( skipnext )); then skipnext=0; continue; fi
          case "$a" in
            -a) rnames+=("${args[$((j + 1))]}"); j=$((j + 1)) ;;
            -[dinNptuOsCc]) skipnext=1 ;;
            -*) : ;;
            *) rnames+=("$a") ;;
          esac
        done
        [[ "$base" == read ]] && rnames+=(REPLY)
        [[ "$base" != read ]] && rnames+=(MAPFILE)
        for x in "${rnames[@]}"; do
          [[ "$x" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]] || continue
          for hv in "${h[@]}"; do
            first="${hv#"${hv%%[![:space:]]*}"}"; first="${first%%[[:space:]]*}"
            _var_poison "$x" "$hv"; _var_poison "$x" "$first"
          done
        done ;;
    esac
  fi

  case "$base" in
    read|select)       _var_get REPLY && _var_poison REPLY ;;
    mapfile|readarray) _var_get MAPFILE && _var_poison MAPFILE ;;
    getopts)
      _var_get OPTARG && _var_poison OPTARG
      _var_get OPTIND && _var_poison OPTIND ;;
  esac

  case "$base" in
    export|declare|typeset|local|readonly)
      # readonly / declare -r: a later assignment to the name fails in bash,
      # but would look like a re-binding here.
      local ro=0
      [[ "$base" == readonly ]] && ro=1
      for a in "${args[@]}"; do
        [[ "$base" != export && "$a" =~ ^[-+][A-Za-z]*r ]] && ro=1
        # declare -n makes a nameref: later writes to it land in another variable.
        if [[ "$a" =~ ^-[A-Za-z]*n ]]; then _var_clear_all; return 0; fi
        # `declare "$N=…"`: the target name itself is an expansion.
        _subst_vars "${a%%=*}"
        if [[ "$RET" == *'$'* ]]; then _var_clear_all; return 0; fi
        # Options can transform the stored value (-l lowercases, -u uppercases,
        # -i evaluates arithmetic, -a/-A make arrays): don't cache the literal.
        [[ "$a" == [-+]* && "$mode" == bind ]] && mode=poison
      done
      # `local` outside a function fails and leaves the old value in place.
      [[ "$base" == local && "$mode" == bind ]] && mode=poison
      for a in "${args[@]}"; do
        [[ "$a" =~ ^[A-Za-z_][A-Za-z0-9_]*= ]] && _assign "$a" "$mode"
      done
      # -l / -u / -c change case, -i evaluates arithmetic, -a / -A make arrays:
      # what bash stores is not the literal assigned, now or later on the line.
      # Such a name is never bound again and is DANGER (any use of it blocks).
      local xattr=0
      for a in "${args[@]}"; do
        # (+l etc. removes an attribute: no transform from it.)
        [[ "$base" != export && "$a" =~ ^-[A-Za-z]*[luciaA] ]] && xattr=1
      done
      (( child )) && xattr=0    # before a | or &: a child shell's attributes
      # -p only displays (declare -ip D); -f / -F name functions, not variables.
      # Options end at the first operand or --: `declare -l D -p` is -l.
      for a in "${args[@]}"; do
        [[ "$a" == -- || "$a" != [-+]* ]] && break
        [[ "$a" =~ ^-[A-Za-z]*[pfF] ]] && xattr=0
      done
      if (( xattr )); then
        for a in "${args[@]}"; do
          [[ "$a" == [-+]* ]] && continue
          x="${a%%=*}"
          [[ "$x" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]] || continue
          _var_has_attr "$x" || ATTR_N+=("$x")
          _var_is_danger "$x" || VAR_D+=("$x")
          _forget "$x"
        done
      fi
      if (( ro )); then
        _unmodelled "$base${args[0]:+ ${args[0]}} (a read-only variable: later assignments to it fail)"
        _var_clear_all
      fi
      return 0
      ;;
    fi|done|esac|for|case|select|function)
      (( iskw )) || return 0    # quoted / prefixed: an ordinary command name
      LINE_CTRL=1
      case "$base" in
        for|select) CTRL_DEPTH=$((CTRL_DEPTH + 1)); _ctrl_open loop; IC_OPENED=1 ;;
        case) CTRL_DEPTH=$((CTRL_DEPTH + 1)); _ctrl_open case; IC_OPENED=1; CASE_OPENED=1 ;;
        fi|done|esac)
          local ck=if
          [[ "$base" == done ]] && ck=loop
          [[ "$base" == esac ]] && ck=case
          if _ctrl_close "$ck" && (( CTRL_DEPTH > 0 )); then CTRL_DEPTH=$((CTRL_DEPTH - 1)); fi ;;
      esac
      case "$base" in
        for|select)
          # After the loop the variable holds one of the listed words (or of
          # "$@" when there is no `in`).
          if [[ "${args[0]}" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]]; then
            if [[ "${args[1]}" == in ]]; then
              for ((j = 2; j < ${#args[@]}; j++)); do _var_poison "${args[0]}" "${args[j]}"; done
            elif [[ "$POS_DANGER" == "1" ]]; then
              _var_is_danger "${args[0]}" || VAR_D+=("${args[0]}")
            fi
          fi ;;
        function)
          _unmodelled "a function definition"
          _fn_taint ;;
      esac
      ;;
    alias)
      # With expand_aliases, a later line runs the alias's text instead. In a
      # child shell (before a | or &) there is no later line.
      (( child )) && return 0
      for a in "${args[@]}"; do
        if [[ "$a" == *=* ]]; then
          _unmodelled "alias"
          _script_text "${a#*=}"; _analyze_deferred "$RET"
          _fn_taint
        fi
      done
      return 0 ;;
    enable)
      (( child )) && return 0
      _unmodelled "enable (it can disable builtins such as cd)"
      _fn_taint
      return 0 ;;
    shopt)
      (( child )) && return 0
      # cdable_vars lets `cd NAME` go to $NAME's value.
      for a in "${args[@]}"; do
        if [[ "$a" == cdable_vars ]]; then _unmodelled "shopt cdable_vars"; _fn_taint; fi
        # A computed option name ({cdable_vars,x}, cdable*, $X) may be it.
        if [[ "$a" != -* ]] && _nonliteral "$a"; then
          _unmodelled "shopt with a computed option name"; _fn_taint
        fi
      done
      return 0 ;;
    trap)
      # trap 'CMD' SIG… runs CMD later, in this shell.
      local -a targs=()
      for ((j = 0; j < ${#args[@]}; j++)); do
        case "${args[j]}" in
          --) targs=("${args[@]:$((j + 1))}"); break ;;
          -[lpP]) ;;
          *) targs=("${args[@]:j}"); break ;;
        esac
      done
      if (( ${#targs[@]} >= 2 )) && [[ "${targs[0]}" != - && -n "${targs[0]}" ]] && (( child )); then
        # In a child shell the handler runs there (on its exit, in this state):
        # judge its writes, nothing it does reaches this shell.
        local tcdc="$CD_COUNT"
        _script_text "${targs[0]}"; _analyze_deferred "$RET"
        CD_COUNT="$tcdc"
        return 0
      fi
      if (( ${#targs[@]} >= 2 )) && [[ "${targs[0]}" != - && -n "${targs[0]}" ]]; then
        _unmodelled "trap (its command runs later in this shell)"
        local cdc="$CD_COUNT"
        _script_text "${targs[0]}"; _analyze_deferred "$RET"
        # A DEBUG / RETURN / ERR handler (or a signal) can run before any later
        # command on the line: if it changes directory, the directory is unknown.
        # An EXIT handler runs only when the shell exits (judged again then).
        local midline=0 sg
        for sg in "${targs[@]:1}"; do
          case "$sg" in EXIT|exit|SIGEXIT|0) ;; *) midline=1 ;; esac
        done
        # An EXIT-only handler's directory changes do not count as changes now.
        (( midline )) || CD_COUNT="$cdc"
        if (( midline )); then
          [[ "$CD_COUNT" != "$cdc" ]] && _dir_lost "trap '${targs[0]}' (its handler changes directory)"
          [[ "$DEF_DST" == 1 ]] && DIRSTK_TAINT=1
          [[ "$DEF_OPT" == 1 ]] && OLDPWD_TAINT=1
          [[ "$DEF_PHYS" == 1 ]] && PHYS=1
          [[ "$DEF_SOT" == 1 ]] && SHOPTS_TAINT=1
          for x in "${DEF_AT[@]}"; do
            _var_has_attr "$x" || ATTR_N+=("$x")
            _var_is_danger "$x" || VAR_D+=("$x")
          done
        fi
        (( DEPTH == 1 )) && DEFERRED+=("$RET")
      fi
      return 0 ;;
    set)
      # set -r: restricted mode, where cd fails. Non-option words replace the
      # positional parameters. In a child shell, none of it reaches here.
      (( child )) && return 0
      local pos=0
      for ((j = 0; j < ${#args[@]}; j++)); do
        a="${args[j]}"
        if (( pos )); then _value_risky "$a" && POS_DANGER=1; continue; fi
        case "$a" in
          --|-|+) pos=1 ;;
          -o|+o)
            j=$((j + 1))
            # -o physical turns it on (+o turns it off); a computed name may be either.
            { [[ "$a" == -o && "${args[j]:-}" == physical ]] || _nonliteral "${args[j]:-}"; } && PHYS=1
            [[ "$a" == +o && "${args[j]:-}" == physical ]] && ! _cd_maybe && PHYS=0 ;;
          -*r*) _unmodelled "set -r (restricted mode: cd fails)"; _fn_taint ;;
          -*P*) PHYS=1 ;;
          +*P*) _cd_maybe || PHYS=0 ;;   # off, unless it may not run
          [-+]*) : ;;
          *) pos=1; _value_risky "$a" && POS_DANGER=1 ;;
        esac
      done
      return 0 ;;
    touch)
      # Not a writer of a literal path. From main, ANY computed argument blocks
      # (rule 4): which words are option values depends on GNU option grammar
      # (clusters, --, abbreviations, POSIXLY_CORRECT), which is not modelled.
      for a in "${args[@]}"; do _check_literal "$a"; done
      return 0 ;;
    dd)
      for a in "${args[@]}"; do
        case "$a" in of=*) _check_literal "${a#of=}" ;; esac
      done
      return 0 ;;
    mkdir)
      # A directory created here makes a later cd into it succeed. From main,
      # any computed argument blocks, as for touch.
      local skipm=0 mp=0
      for a in "${args[@]}"; do _check_literal "$a"; done
      for a in "${args[@]}"; do
        [[ "$a" == --parents || "$a" =~ ^-[A-Za-z]*p ]] && mp=1
      done
      # Only a mkdir that certainly runs counts (not after && / || or in an
      # if / loop), and a relative one only from a known directory.
      _cd_maybe && return 0
      for a in "${args[@]}"; do
        if (( skipm )); then skipm=0; continue; fi
        case "$a" in
          -m) skipm=1 ;;
          -*) : ;;
          *) _expand_path "$a"
             if [[ "$RETUNRES" == "0" ]]; then
               x="$RET"
               if [[ "$x" != /* ]]; then
                 [[ "$DIR_UNRESOLVED" == 1 ]] && continue
                 x="$CURDIR/$x"
               fi
               # Without -p, mkdir fails unless the parent exists already.
               if (( ! mp )); then
                 _lexnorm "$x/.."
                 [[ -d "$RET" ]] || _was_created_exact "$RET" || continue
               fi
               _record_created "$x"
             fi ;;
        esac
      done
      return 0 ;;
    printf|read|readarray|mapfile|unset|getopts|let|wait)
      # These can write a variable named by an argument (printf and wait only
      # with -v / -p). If an argument still holds an unresolved expansion, the
      # target is unknown: drop everything.
      local writes=1
      if [[ "$base" == printf || "$base" == wait ]]; then
        writes=0
        for a in "${args[@]}"; do
          [[ "$a" == --* ]] && break
          [[ "$a" =~ ^-[A-Za-z]*[vp] ]] && writes=1
        done
      fi
      (( writes )) && for a in "${args[@]}"; do
        _subst_vars "$a"
        if [[ "$RET" == *'$'* ]]; then _var_clear_all; break; fi
      done
      # printf -v NAME FMT ARGS…: NAME may hold any argument, or FMT with its
      # %s filled in (printf -v D '%s/%s' /path repo).
      if [[ "$base" == printf ]]; then
        local pv="" k=0
        while (( k < ${#args[@]} )); do
          a="${args[k]}"
          case "$a" in
            --) k=$((k + 1)); break ;;
            -v) pv="${args[$((k + 1))]}"; k=$((k + 2)) ;;
            -v*) pv="${a#-v}"; k=$((k + 1)) ;;
            -*) k=$((k + 1)) ;;
            *) break ;;
          esac
        done
        _subst_vars "$pv"; pv="${RET%%\[*}"   # printf -v "$N": the name N holds
        if [[ "$pv" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]]; then
          local -a pa=("${args[@]:k}")
          local built="${pa[0]}" pi=1
          for x in "${pa[@]}"; do _var_poison "$pv" "$x"; done
          while [[ "$built" == *%s* ]] && (( pi < ${#pa[@]} )); do
            built="${built/\%s/${pa[pi]}}"; pi=$((pi + 1))
          done
          _var_poison "$pv" "$built"
        fi
      fi
      ;;
    source|.)
      _var_clear_all   # a sourced file can set anything
      # It runs in this shell and may cd anywhere.
      (( child )) || _dir_lost "$base ${args[0]:-} (a sourced file may cd anywhere)"
      ;;
    cd|pushd|popd)
      # Before a `|` or `&` the cd runs in a child shell, and after env / sudo
      # / xargs / … it is a separate process: this shell does not move.
      (( child )) && return 0
      if (( lastm )); then
        # It may run here: the directory, OLDPWD and the stack are uncertain.
        _dir_lost "$base at the end of a pipeline (it may run in this shell or a child)"
        return 0
      fi
      ;;
  esac
  # A command name built from an expansion ($X, "$(…)") may itself be cd.
  if (( ! child )) && [[ "$name" == *'$'* || "$name" == *'`'* ]]; then
    _shown "$name"
    _dir_lost "a command named by an expansion ('$RET'): it may be cd"
  fi
  case "$base" in
    cd|pushd)
      # bash's cd takes -L -P -e -@; pushd takes -n. Option parsing stops at
      # the first operand (or --); every word after that is an operand.
      local target="" ntgt=0 dashdash=0 bad="" sawopt=0 nocd=0 rot=0 lp=""
      for a in "${args[@]}"; do
        if (( dashdash )); then
          ntgt=$((ntgt + 1)); (( ntgt == 1 )) && target="$a"; continue
        fi
        case "$a" in
          --) dashdash=1; sawopt=1 ;;
          -) ntgt=1; target=-; dashdash=1 ;;
          [-+][0-9]*)
            if [[ "$base" == pushd ]]; then rot=1
            elif [[ "$a" == -* ]]; then bad="$a"
            else ntgt=1; target="$a"; dashdash=1; fi ;;
          -*)
            sawopt=1
            if [[ "$base" == cd ]]; then
              [[ "$a" =~ ^-[LPe@]+$ ]] || bad="$a"
              # The last of -L / -P wins.
              local lpx="${a//[^LP]/}"; [[ -n "$lpx" ]] && lp="${lpx: -1}"
            else [[ "$a" =~ ^-n+$ ]] && nocd=1 || bad="$a"; fi ;;
          *) ntgt=1; target="$a"; dashdash=1 ;;
        esac
      done
      # Anything bash's cd refuses, or that this guard cannot follow, leaves
      # the directory unknown: never resolve it, fail closed (2026-11-23).
      # A pushd this guard cannot follow, or one that may fail (a relative or
      # missing directory), may or may not have pushed: the stack is uncertain.
      if [[ "$base" == pushd ]] && (( ! nocd && ! rot )); then
        if [[ -n "$bad" ]] || (( ntgt != 1 )) || [[ -z "$target" ]] || _nonliteral "$target" \
           || ! { [[ "$target" == /* && -d "$target" ]] || _was_created "${target%/}"; }; then
          DIRSTK_TAINT=1
        fi
      fi
      if [[ -n "$bad" ]]; then
        _dir_unknown "$base $bad (an option $base does not take: it fails)"; return 0
      fi
      if (( ntgt > 1 )); then
        _dir_unknown "$base with more than one directory (it fails)"; return 0
      fi
      if [[ "$base" == pushd ]]; then
        # pushd -n only edits the stack; +N / -N or no directory rotates it.
        # -n edits the stack without changing directory (inserting DIR, or
        # rotating with +N / -N): the stack is uncertain from here on.
        if (( nocd )); then DIRSTK+=("?"); DIRSTK_TAINT=1; return 0; fi
        # Rotation / a swap reorders the stack too.
        if (( rot || ntgt == 0 )); then DIRSTK_TAINT=1; _cd_back "?"; return 0; fi
      fi
      if (( ntgt == 0 )); then
        # A bare cd goes to $HOME; cd -L / cd -- (options only) are not followed.
        if (( sawopt )); then _dir_unknown "$base with options but no directory"; return 0; fi
        target='~'
      elif [[ -z "$target" ]]; then
        _dir_unknown "$base '' (an empty directory: bash refuses it)"; return 0
      fi
      if [[ "$target" == "-" && "$base" == cd ]]; then
        if [[ -n "$OLD_CUR" && "$OLDPWD_TAINT" == 0 ]]; then _cd_back "$OLD_CUR"; else _cd_back "?"; fi
        return 0
      fi
      if _nonliteral "$target"; then
        # Built from an expansion, a glob, brace expansion or ~user: never
        # resolved, not even from bindings on this line.
        _shown "$target"
        _dir_unknown "$base '$RET' (a directory built from an expansion, a glob or ~user)"
        return 0
      fi
      if [[ "$base" == pushd ]]; then
        if [[ "$DIR_UNRESOLVED" == "1" ]]; then DIRSTK+=("?"); else DIRSTK+=("$CURDIR"); fi
        _cd_maybe && DIRSTK_TAINT=1     # it may not run: the stack is uncertain
      fi
      _cd_to "$target" "$lp"
      return 0 ;;

    dirs)
      (( child )) && return 0   # before a | or &: a child shell's stack
      # dirs -c clears the stack: popd may then fail and stay put. The other
      # options (-l -p -v, +N / -N) only display it. A computed argument may
      # be -c.
      for a in "${args[@]}"; do
        if [[ "$a" =~ ^-[A-Za-z]*c ]] || _nonliteral "$a"; then DIRSTK_TAINT=1; fi
      done
      return 0 ;;

    popd)
      local pn=0
      for a in "${args[@]}"; do
        case "$a" in
          -n) pn=1 ;;                           # stack only, no cd
          [-+][0-9]*) DIRSTK_TAINT=1; _cd_back "?"; return 0 ;;   # removes the Nth entry
          *)
            # Not -n / +N / -N as written: invalid (popd fails), or computed
            # ("$N"), which may expand to -n or +N and edit the stack.
            DIRSTK_TAINT=1
            _dir_unknown "popd $a (an argument this guard cannot follow)"; return 0 ;;
        esac
      done
      if (( pn )); then
        # popd -n drops the next entry without changing directory.
        local nn=${#DIRSTK[@]}
        if _cd_maybe; then DIRSTK_TAINT=1
        elif (( nn > 0 )); then unset "DIRSTK[$((nn - 1))]"; DIRSTK=("${DIRSTK[@]}"); fi
        return 0
      fi
      if [[ "$DIRSTK_TAINT" == 1 ]]; then _cd_back "?"; return 0; fi
      local nd=${#DIRSTK[@]}
      (( nd == 0 )) && return 0                 # empty stack: popd fails, no cd
      _cd_back "${DIRSTK[$((nd - 1))]}"
      unset "DIRSTK[$((nd - 1))]"
      DIRSTK=("${DIRSTK[@]}")
      return 0 ;;

    eval)
      # eval re-parses its arguments, quoting and all: analyse the text, but a
      # main checkout in play blocks regardless (fail closed).
      _unmodelled "eval"
      _script_text "${args[*]}"
      if (( child )); then
        # Before a `|` or `&`, eval runs in a child shell: nothing it does,
        # its directory changes included, persists here.
        local ccdc="$CD_COUNT"
        _analyze_deferred "$RET"
        CD_COUNT="$ccdc"; IC_CHILD=1
      elif (( lastm )); then
        # At the end of a pipeline it may run here or in a child.
        local lcdc="$CD_COUNT"
        _analyze_text "$RET"
        if [[ "$CD_COUNT" != "$lcdc" ]]; then
          _dir_lost "eval at the end of a pipeline (it may run in this shell or a child)"
        fi
      else
        local edir="$CURDIR" ecdc="$CD_COUNT" econd=0
        [[ "$NEXT_COND" == "1" ]] || (( CTRL_DEPTH > 0 )) && econd=1
        _analyze_text "$RET"
        # A conditional eval may not run: if it changed directory, the shell
        # may still be where it was.
        if (( econd )) && [[ "$CD_COUNT" != "$ecdc" ]]; then _alt_add "$edir"; ALT_GUARD=0; fi
      fi
      _var_clear_all
      return 0 ;;

    bash|sh|zsh|dash|ksh)
      # `bash -c` is a child process, so like a subshell its `cd` cannot move
      # this shell — analyse the script, then put the working directory back.
      # (`eval` above is deliberately NOT restored: it runs in the same shell,
      # so its `cd` really does persist.)
      # Find the command string: the first operand after a c option (-c, or a
      # cluster such as -ec). -O / -o / --rcfile take an argument.
      # A new shell starts logical unless an exported SHELLOPTS or its own
      # invocation (-P, -o physical) says otherwise.
      local cseen=0 sidx=-1 ddash=0 m cphys=0 cbase=0
      [[ "$PHYS_ENV" == 1 || "$SHOPTS_TAINT" == 1 ]] && cbase=1
      for ((j = 0; j < ${#args[@]}; j++)); do
        a="${args[j]}"
        if (( ! ddash )); then
          case "$a" in
            -O|+O|-o|+o|--rcfile|--init-file)
              j=$((j + 1))
              # In order: the last of -o / +o physical wins (a computed name may be it).
              if [[ "$a" == -o ]] && { [[ "${args[j]:-}" == physical ]] || _nonliteral "${args[j]:-}"; }; then cphys=1
              elif [[ "$a" == +o && "${args[j]:-}" == physical ]]; then cphys=0; fi
              continue ;;
            --) ddash=1; continue ;;
            --*) continue ;;
            [-+]*)
              [[ "$a" == -*c* ]] && cseen=1
              [[ "$a" == -*P* ]] && cphys=1
              [[ "$a" == +*P* ]] && cphys=0
              continue ;;
          esac
        fi
        (( cseen )) && sidx=$j
        break
      done
      if (( sidx >= 0 )); then
        local sdir="$CURDIR" sunres="$DIR_UNRESOLVED" sddanger="$DIR_DANGER" swhy="$DIR_WHY"
        local salt="$DIR_ALT" sguard="$ALT_GUARD" sold="$OLD_CUR" stcd="$TILDE_CD" scdc="$CD_COUNT"
        local sdst="$DIRSTK_TAINT" sopt="$OLDPWD_TAINT"
        local -a sat=("${ATTR_N[@]}")
        local sphys="$PHYS" ssot="$SHOPTS_TAINT"
        local -a sstk=("${DIRSTK[@]}")
        # A new shell does not inherit unexported variables. Rather than
        # track export state, hide every binding while analysing the child,
        # so its expansions are unresolved (fail closed) as without bindings.
        local -a svk=("${VAR_K[@]}") svv=("${VAR_V[@]}")
        # An exported binding IS inherited: one holding a main-checkout path
        # must stay dangerous in the child, where it is hidden.
        for ((m = 0; m < ${#VAR_K[@]}; m++)); do
          [[ -n "${VAR_K[m]}" ]] && _mark_danger_if_main "${VAR_K[m]}" "${VAR_V[m]}"
        done
        # Prefix assignments (`D=x bash -c …`, `env D=x bash -c …`) are
        # exported to the child too.
        for ((m = 0; m < i; m++)); do
          if [[ "${w[m]}" =~ ^([A-Za-z_][A-Za-z0-9_]*)=(.*)$ ]]; then
            local pn="${BASH_REMATCH[1]}" pv="${BASH_REMATCH[2]}"
            # Known variables in the value count (D=$ROOT bash -c …).
            RETDANGER=0; _subst_vars "$pv"; pv="$RET"
            if [[ "$RETDANGER" == "1" ]]; then
              _var_is_danger "$pn" || VAR_D+=("$pn")
            else
              case "$pv" in
                *'$'*|'~'*|*':~'*) ;;
                *) _mark_danger_if_main "$pn" "$pv" ;;
              esac
            fi
          fi
        done
        VAR_K=(); VAR_V=()
        local snc="$NEXT_COND" snp="$NEXT_PIPE"
        # An inherited physical mode (exported SHELLOPTS) is not undone here.
        (( cbase )) && cphys=1
        NEXT_PIPE=0; NEXT_COND=0; PHYS="$cphys"
        _script_text "${args[sidx]}"; _analyze_text "$RET"
        VAR_K=("${svk[@]}"); VAR_V=("${svv[@]}")
        CURDIR="$sdir"; DIR_UNRESOLVED="$sunres"; DIR_DANGER="$sddanger"; DIR_WHY="$swhy"
        DIR_ALT="$salt"; ALT_GUARD="$sguard"; OLD_CUR="$sold"; DIRSTK=("${sstk[@]}")
        TILDE_CD="$stcd"; CD_COUNT="$scdc"; NEXT_COND="$snc"; NEXT_PIPE="$snp"
        DIRSTK_TAINT="$sdst"; OLDPWD_TAINT="$sopt"; ATTR_N=("${sat[@]}"); PHYS="$sphys"; SHOPTS_TAINT="$ssot"
        return 0
      fi
      return 0 ;;

    devcontainer-exec)
      _block_if_cwd_main "bin/devcontainer-exec"
      return 0 ;;

    rsync)
      _block_if_cwd_main "rsync"
      # `rsync SRC` with no destination LISTS src — it writes nothing, so the
      # lone argument must not be judged as a write target. Only treat the last
      # non-flag argument as a destination when there is something before it.
      _last_nonflag "${args[@]}"
      (( RETCOUNT >= 2 )) && _check_dest "$RET" remote
      return 0 ;;

    patch)
      _block_if_cwd_main "patch"
      return 0 ;;

    sed|gsed|perl)
      if _has_inplace_flag "${args[@]}"; then
        _block_if_cwd_main "$base -i (in-place edit)"
        local skip=0
        for a in "${args[@]}"; do
          if (( skip )); then skip=0; continue; fi
          case "$a" in
            -e|-f|-E|--expression|--file) skip=1; continue ;;
            -*) continue ;;
          esac
          _check_dest "$a"
        done
      fi
      return 0 ;;

    cp|mv|install|ln)
      # -t DIR / -tDIR / clustered -vt DIR / --target-directory[=]DIR name the
      # destination; every non-flag argument is then a source. Otherwise the
      # destination is the last non-flag argument.
      local tdir="" tset=0 k=0 m=${#args[@]}
      while (( k < m )); do
        a="${args[k]}"
        case "$a" in
          --) break ;;
          --target-directory=*) tdir="${a#*=}"; tset=1 ;;
          --target-directory) tdir="${args[$((k + 1))]}"; tset=1; k=$((k + 1)) ;;
          --*) : ;;
          -*)
            if [[ "$a" =~ ^-[A-Za-z]*t$ ]]; then
              tdir="${args[$((k + 1))]}"; tset=1; k=$((k + 1))
            elif [[ "$a" =~ ^-[A-Za-z]*t(.+)$ ]]; then
              tdir="${BASH_REMATCH[1]}"; tset=1
            fi ;;
        esac
        k=$((k + 1))
      done
      if (( tset )); then
        _check_dest "$tdir"
      else
        _last_nonflag "${args[@]}"
        _check_dest "$RET"
      fi
      return 0 ;;

    tee)
      for a in "${args[@]}"; do
        case "$a" in -*) continue ;; esac
        _check_dest "$a"
      done
      return 0 ;;

    git)
      local gdir="$CURDIR" gunres="$DIR_UNRESOLVED" sub="" sub2="" k=0 galt="" gcomp="" gtilde=0 gcwd=1
      local m=${#args[@]}
      _alt_active && galt="$DIR_ALT"
      while (( k < m )); do
        case "${args[k]}" in
          -C)
            [[ -z "$gcomp" ]] && _nonliteral "${args[$((k + 1))]}" && _main_in_play && gcomp="${args[$((k + 1))]}"
            case "${args[$((k + 1))]}" in '~'|'~/'*) gtilde=1; gcwd=0 ;; /*) gtilde=0; gcwd=0 ;; esac
            _abs_path "${args[$((k + 1))]}" "$CURDIR"
            if [[ "$RETUNRES" == "1" ]]; then gunres=1
            elif [[ "$gunres" == 1 && "${args[$((k + 1))]}" != /* && "${args[$((k + 1))]}" != '~'* ]]; then
              :   # relative to a directory that is already unknown
            else gunres=0; gdir="$RET"; fi
            if [[ -n "$galt" ]]; then
              if [[ "${args[$((k + 1))]}" == /* ]]; then galt=""
              else _abs_path "${args[$((k + 1))]}" "$galt"; galt="$RET"; fi
            fi
            k=$((k + 2)) ;;
          -c|--git-dir|--work-tree|--namespace|--exec-path)
            k=$((k + 2)) ;;
          -*)
            k=$((k + 1)) ;;
          *)
            sub="${args[k]}"; sub2="${args[$((k + 1))]}"; break ;;
        esac
      done
      local mutating=0
      case "$sub" in
        apply|am|cherry-pick|revert) mutating=1 ;;
        stash) [[ "$sub2" == "pop" || "$sub2" == "apply" ]] && mutating=1 ;;
        worktree)
          # git worktree add <path> creates <path>; a later cd into it succeeds.
          if [[ "$sub2" == add ]]; then
            local wk=$((k + 2)) wa
            while (( wk < m )); do
              wa="${args[wk]}"
              case "$wa" in
                -b|-B|--reason) wk=$((wk + 2)); continue ;;
                -*) wk=$((wk + 1)); continue ;;
              esac
              _abs_path "$wa" "$gdir"
              [[ "$RETUNRES" == "0" && "$gunres" == "0" ]] && _record_created "$RET"
              break
            done
          fi ;;
      esac
      if (( mutating )); then
        (( TILDE_CD && gcwd )) && TILDE_SEEN=1
        [[ "$gtilde" == 1 ]] && TILDE_SEEN=1
        if [[ -n "$gcomp" ]]; then
          _main_dir
          _block "git -C '$gcomp' $sub, a directory built from an expansion" "$RET" nonliteral
        elif [[ "$gunres" == "1" && "$gcwd" == 1 ]]; then
          _block "git $sub after $DIR_WHY" "$gdir" unresolved
        elif [[ "$gunres" == "1" ]]; then
          _block "git $sub (unresolvable target directory — fail closed)" "$gdir"
        else
          _nearest_dir "$gdir"
          if _is_main_checkout "$RET"; then
            _block "git $sub" "$RET"
          elif [[ -n "$galt" ]] && _dir_is_main "$galt"; then
            _block "git $sub (after a cd that may have failed: its target does not exist)" "$galt"
          fi
        fi
      fi
      return 0 ;;
  esac
  return 0
}

# --- lexer ------------------------------------------------------------------

_end_word() {
  (( LX_HAVE )) || return 0
  case "$LX_PEND" in
    1) LX_REDIRS+=("$LX_CUR") ;;
    2) LX_OTHER+=("$LX_CUR") ;;
    3) LX_HSTR+=("$LX_CUR") ;;
    4)
      # `>& word`: an fd (2, 1-, -) — or, for anything else, a FILE that gets
      # both stdout and stderr.
      if [[ "$LX_CUR" =~ ^[0-9]*-?$ ]]; then LX_OTHER+=("$LX_CUR"); else LX_REDIRS+=("$LX_CUR"); fi ;;
    *) LX_WORDS+=("$LX_CUR"); LX_WQ+=("$LX_QN") ;;
  esac
  LX_PEND=0; LX_CUR=""; LX_HAVE=0; LX_QN=0
}

# A word quoted or escaped before its first `=` ("D=x", 'D'=x, D\=x) is a
# command name to bash, not an assignment. The lexer drops quoting, so it
# records that here (LX_WQ, parallel to LX_WORDS).
_note_quote() {
  [[ "$LX_CUR" == *=* ]] || LX_QN=1
}

_end_cmd() {
  _end_word
  local had=${#LX_WORDS[@]} pat=0 patok=0 cparen="$LX_CPAREN"
  LX_CPAREN=0
  # A pattern list ends at `)`, continues after `|` or a newline. A command
  # ended by ; && || & is never a pattern (fail closed: never skip a command).
  case "$LX_TERM" in pipe|rparen|seq) patok=1 ;; esac
  if (( had > 0 || ${#LX_REDIRS[@]} + ${#LX_OTHER[@]} + ${#LX_HSTR[@]} > 0 )); then
    # In a case statement, the words after `in` or ;; up to `)` are patterns
    # (`a|cd|fi)`), not commands; an unquoted esac there ends the case.
    if (( patok )) && { [[ "$CASE_PAT" == 2 ]] || { [[ "$CASE_PAT" == 1 ]] && ! [[ "${LX_WORDS[0]:-}" == esac && "${LX_WQ[0]:-0}" != 1 ]]; }; }; then
      pat=1
    else
      CASE_PAT=0; CASE_OPENED=0
      IC_WORDS=("${LX_WORDS[@]}")
      IC_REDIRS=("${LX_REDIRS[@]}")
      IC_OTHER=("${LX_OTHER[@]}")
      IC_HSTR=("${LX_HSTR[@]}")
      IC_WQ=("${LX_WQ[@]}")
      _inspect_cmd
      IC_CHILD=0
      if (( CASE_OPENED )); then
        # `case WORD in esac` is a whole (empty) case statement.
        if (( ! cparen )) && [[ "${LX_WORDS[3]:-}" == esac && "${LX_WQ[3]:-0}" != 1 ]]; then
          if _ctrl_close case && (( CTRL_DEPTH > 0 )); then CTRL_DEPTH=$((CTRL_DEPTH - 1)); fi
        elif (( patok )); then
          pat=1                     # `case WORD in [first pattern…]`
        fi
      fi
    fi
  fi
  LX_WORDS=(); LX_WQ=(); LX_REDIRS=(); LX_OTHER=(); LX_HSTR=(); LX_PEND=0
  if (( pat )); then
    # `)` ends the pattern list; `|` or a newline continues it. Neither starts
    # a pipeline or an and-list for the commands after it.
    if [[ "$LX_TERM" == rparen ]]; then CASE_PAT=0; NEXT_COND=0; NEXT_PIPE=0
    elif [[ "$CASE_PAT" != 2 ]]; then CASE_PAT=1; fi
    LX_TERM=seq
    return 0
  fi
  # The commands after `cd <missing> &&` run only if that cd succeeded; the
  # first one ending in ; / || / & closes that and-list.
  if (( had > 0 )); then
    case "$LX_TERM" in seq|semi|or|bg) ALT_GUARD=0 ;; esac
  fi
  # How the NEXT command is entered. An empty command ending at a newline (the
  # line after a trailing `&&`) leaves that state alone.
  case "$LX_TERM" in
    and|or) NEXT_COND=1; NEXT_PIPE=0 ;;
    pipe)   NEXT_PIPE=1 ;;
    *)      (( had > 0 )) && { NEXT_COND=0; NEXT_PIPE=0; } ;;
  esac
  LX_TERM=seq
}

# Is the `)` at C the end of a case pattern? Yes while in a pattern list (not
# at an unquoted esac outside a leading `(`), or on `case WORD in pattern)`.
_in_case_pattern() {
  local nw=${#LX_WORDS[@]} first="${LX_WORDS[0]:-}"
  [[ -z "$first" ]] && (( LX_HAVE )) && first="$LX_CUR"
  [[ "$CASE_PAT" == 2 ]] && return 0
  if [[ "$CASE_PAT" == 1 ]]; then
    [[ "$first" == esac ]] && return 1
    return 0
  fi
  (( nw >= 3 )) && [[ "${LX_WORDS[0]}" == case && "${LX_WORDS[2]}" == in ]]
}

# Restore the working directory a subshell context was entered with. A `cd`
# inside `$( … )` / backticks / `( … )` is scoped to the child shell and must
# not follow the parent out. Dynamically scoped: reads `term` and the saved
# values from the _lex_context frame that calls it.
_leave_context() {
  # A case still in its pattern list, or a compound opened here and not
  # closed: this guard lost track of the syntax. Fail closed.
  if [[ "$CASE_PAT" != 0 ]] || (( ${#CTRL_STK[@]} > ${#LX_SAVED_CS[@]} )); then PARSE_ERROR=1; fi
  [[ -z "$term" ]] && return 0
  CURDIR="$LX_SAVED_DIR"
  DIR_UNRESOLVED="$LX_SAVED_UNRES"
  DIR_DANGER="$LX_SAVED_DDANGER"; DIR_WHY="$LX_SAVED_WHY"
  DIR_ALT="$LX_SAVED_ALT"; ALT_GUARD="$LX_SAVED_GUARD"; OLD_CUR="$LX_SAVED_OLD"
  DIRSTK=("${LX_SAVED_STK[@]}"); TILDE_CD="$LX_SAVED_TCD"
  # Assignments in a subshell are scoped to it too.
  VAR_K=("${LX_SAVED_VK[@]}")
  VAR_V=("${LX_SAVED_VV[@]}")
  NEXT_COND="$LX_SAVED_NC"; NEXT_PIPE="$LX_SAVED_NP"; LX_TERM=seq
  CTRL_DEPTH="$LX_SAVED_CD"; CTRL_STK=("${LX_SAVED_CS[@]}"); CTRL_SNAP=("${LX_SAVED_CSN[@]}")
  CD_COUNT="$LX_SAVED_CDC"; DIRSTK_TAINT="$LX_SAVED_DST"; OLDPWD_TAINT="$LX_SAVED_OPT"
  CASE_PAT="$LX_SAVED_CP"; ATTR_N=("${LX_SAVED_AT[@]}"); PHYS="$LX_SAVED_PHYS"; SHOPTS_TAINT="$LX_SAVED_SOT"
}

_lex_context() { # $1 terminator: "" (EOF), ")" or "`"
  local term="$1"
  # Per-invocation lexer state. Declared `local` so nested contexts (command
  # substitutions, subshells) get their own; the _end_word/_end_cmd helpers see
  # the innermost one through bash's dynamic scoping.
  local -a LX_WORDS=()
  local -a LX_REDIRS=()
  local -a LX_OTHER=()
  local -a LX_HSTR=()
  local -a LX_WQ=()
  local LX_CUR="" LX_HAVE=0 LX_PEND=0 LX_QN=0
  local LX_SAVED_DIR="$CURDIR" LX_SAVED_UNRES="$DIR_UNRESOLVED" LX_SAVED_DDANGER="$DIR_DANGER" LX_SAVED_WHY="$DIR_WHY"
  local LX_SAVED_ALT="$DIR_ALT" LX_SAVED_GUARD="$ALT_GUARD" LX_SAVED_OLD="$OLD_CUR" LX_SAVED_TCD="$TILDE_CD"
  local -a LX_SAVED_STK=("${DIRSTK[@]}") LX_SAVED_CS=("${CTRL_STK[@]}") LX_SAVED_CSN=("${CTRL_SNAP[@]}")
  local -a LX_SAVED_AT=("${ATTR_N[@]}")
  local -a LX_SAVED_VK=("${VAR_K[@]}") LX_SAVED_VV=("${VAR_V[@]}")
  local LX_SAVED_NC="$NEXT_COND" LX_SAVED_NP="$NEXT_PIPE" LX_SAVED_CD="$CTRL_DEPTH" LX_SAVED_CDC="$CD_COUNT" LX_SAVED_DST="$DIRSTK_TAINT" LX_SAVED_OPT="$OLDPWD_TAINT" LX_SAVED_CP="$CASE_PAT" LX_SAVED_PHYS="$PHYS" LX_SAVED_SOT="$SHOPTS_TAINT"
  local line ch nx rest run
  # `( … )`, `$( … )` and backticks are a new shell: its first command is not
  # the enclosing pipeline member or and-list operand (all of it is restored
  # on leaving).
  if [[ -n "$term" ]]; then NEXT_PIPE=0; NEXT_COND=0; CASE_PAT=0; fi

  while :; do
    STEPS=$((STEPS + 1))
    if (( STEPS > MAXSTEPS )); then PARSE_ERROR=1; _end_cmd; _leave_context; return; fi

    if (( L >= ${#LINES[@]} )); then
      [[ -n "$term" ]] && PARSE_ERROR=1
      _end_cmd
      _leave_context
      return
    fi
    line="${LINES[L]}"

    if (( C >= ${#line} )); then
      _end_cmd
      if (( ${#HD[@]} > 0 )); then _consume_heredocs; fi
      L=$((L + 1)); C=0
      continue
    fi

    # Fast path: swallow a whole run of ordinary word characters at once.
    rest="${line:C}"
    if [[ "$rest" =~ $ORDRUN_RE ]]; then
      run="${BASH_REMATCH[1]}"
      if [[ -n "$run" ]]; then
        LX_CUR="$LX_CUR$run"; LX_HAVE=1; C=$((C + ${#run}))
        continue
      fi
    fi

    ch="${line:C:1}"
    case "$ch" in
      '\')
        nx="${line:$((C + 1)):1}"
        if [[ -z "$nx" ]]; then
          C=$((C + 1))                       # line continuation
        elif [[ "$nx" == '$' ]] && (( BQ == 0 )); then
          _note_quote; LX_CUR="$LX_CUR$LITD"; LX_HAVE=1; C=$((C + 2))   # \$: a literal $
        else
          # \~ at a word's start is a literal ~, not a tilde expansion.
          [[ "$nx" == '~' && -z "$LX_CUR" ]] && LX_CUR="$QTILDE"
          _note_quote; LX_CUR="$LX_CUR$nx"; LX_HAVE=1; C=$((C + 2))
        fi ;;
      "'")
        # Every $ in '…' is literal: mark it so it is never expanded.
        _note_quote; C=$((C + 1)); _read_sq
        [[ "$RET" == '~'* && -z "$LX_CUR" ]] && LX_CUR="$QTILDE"   # '~/x': a literal ~
        LX_CUR="$LX_CUR${RET//\$/$LITD}"; LX_HAVE=1 ;;
      '"')
        _note_quote; C=$((C + 1)); _read_dq
        [[ "$RET" == '~'* && -z "$LX_CUR" ]] && LX_CUR="$QTILDE"   # "~/x": a literal ~
        LX_CUR="$LX_CUR$RET"; LX_HAVE=1 ;;
      '`')
        if [[ "$term" == '`' ]]; then C=$((C + 1)); _end_cmd; _leave_context; return; fi
        C=$((C + 1)); BQ=$((BQ + 1)); _lex_context '`'; BQ=$((BQ - 1))
        LX_CUR="$LX_CUR$CMDSUB"; LX_HAVE=1 ;;
      '$')
        if [[ "${line:$((C + 1)):1}" == '(' ]]; then
          local arith=0; [[ "${line:$((C + 2)):1}" == '(' ]] && arith=1
          C=$((C + 2)); _lex_context ')'; LX_CUR="$LX_CUR$CMDSUB"; LX_HAVE=1
          (( arith )) && _var_clear_all   # $((D=0)) assigns in this shell
        elif [[ "${line:$((C + 1)):1}" == "'" ]]; then
          _note_quote; C=$((C + 2)); _read_ansi; LX_CUR="$LX_CUR$RET"; LX_HAVE=1      # $'…'
        elif [[ "${line:$((C + 1)):1}" == '"' ]]; then
          # $"…" is "…" translated through the locale: its text may change.
          _note_quote; C=$((C + 2)); _read_dq; LX_CUR="$LX_CUR$RET$QMARK"; LX_HAVE=1
        else
          LX_CUR="$LX_CUR$ch"; LX_HAVE=1; C=$((C + 1))
        fi ;;
      '#')
        if (( LX_HAVE )); then
          LX_CUR="$LX_CUR$ch"; C=$((C + 1))
        else
          C=${#line}                         # comment to end of line
        fi ;;
      ' '|$'\t')
        _end_word; C=$((C + 1)) ;;
      ';')
        LX_TERM=semi; _end_cmd; C=$((C + 1))
        # ;; ;& ;;& end a case item: what follows is the next pattern list.
        if [[ "${line:C:1}" == ";" ]]; then C=$((C + 1)); CASE_PAT=1; fi
        if [[ "${line:C:1}" == "&" ]]; then C=$((C + 1)); CASE_PAT=1; fi ;;
      '|')
        if [[ "${line:$((C + 1)):1}" == "|" ]]; then LX_TERM=or; else LX_TERM=pipe; fi
        _end_cmd; C=$((C + 1))
        case "${line:C:1}" in '|'|'&') C=$((C + 1)) ;; esac ;;
      '&')
        if [[ "${line:$((C + 1)):1}" == ">" ]]; then
          _end_word; C=$((C + 2))
          [[ "${line:C:1}" == ">" ]] && C=$((C + 1))
          LX_PEND=1
        else
          if [[ "${line:$((C + 1)):1}" == "&" ]]; then LX_TERM=and; else LX_TERM=bg; fi
          _end_cmd; C=$((C + 1))
          [[ "${line:C:1}" == "&" ]] && C=$((C + 1))
        fi ;;
      '(')
        # The optional `(` before a case pattern: `case x in (a) …`, `;; (b) …`.
        if (( ! LX_HAVE )); then
          local nw=${#LX_WORDS[@]}
          if [[ "$CASE_PAT" == 1 ]] && (( nw == 0 )); then
            C=$((C + 1)); CASE_PAT=2; continue
          fi
          if (( nw >= 3 )) && [[ "${LX_WORDS[0]}" == case && "${LX_WORDS[$((nw - 1))]}" == in ]]; then
            C=$((C + 1)); LX_CPAREN=1; continue
          fi
        fi
        # NAME() / function NAME(): a function definition, not a subshell.
        local fnrest="${line:$((C + 1))}" fnname="" fnre='^([[:space:]]*\))'
        if [[ "$fnrest" =~ $fnre ]]; then
          local -a fnw=("${LX_WORDS[@]}")
          (( LX_HAVE )) && fnw+=("$LX_CUR")
          [[ "${fnw[0]}" == function ]] && fnw=("${fnw[@]:1}")
          (( ${#fnw[@]} == 1 )) && [[ "${fnw[0]}" != *=* ]] && fnname="${fnw[0]}"
        fi
        if [[ -n "$fnname" ]]; then
          C=$((C + 1 + ${#BASH_REMATCH[1]}))
          LX_WORDS=(); LX_WQ=(); LX_CUR=""; LX_HAVE=0; LX_QN=0
          _unmodelled "a function definition ($fnname)"
          _fn_taint
          continue
        fi
        _end_cmd
        # `((…))` is arithmetic in THIS shell, not a subshell: it can assign
        # (D=0, D++). The context below restores bindings on exit like a
        # subshell would, so drop them all again once it returns.
        if [[ "${line:$((C + 1)):1}" == '(' ]]; then
          C=$((C + 1)); _lex_context ')'; _var_clear_all
        else
          C=$((C + 1)); _lex_context ')'
        fi ;;
      ')')
        # Inside $( … ) or ( … ), the `)` that ends a case pattern does not end
        # the substitution or subshell.
        if [[ "$term" == ')' ]] && ! _in_case_pattern; then C=$((C + 1)); _end_cmd; _leave_context; return; fi
        LX_TERM=rparen; _end_cmd; C=$((C + 1)) ;;
      '>')
        if [[ "$LX_CUR" =~ ^[0-9]+$ ]]; then LX_CUR=""; LX_HAVE=0; fi
        _end_word; C=$((C + 1))
        [[ "${line:C:1}" == ">" ]] && C=$((C + 1))
        [[ "${line:C:1}" == "|" ]] && C=$((C + 1))
        if [[ "${line:C:1}" == "&" ]]; then C=$((C + 1)); LX_PEND=4; else LX_PEND=1; fi ;;
      '<')
        if [[ "$LX_CUR" =~ ^[0-9]+$ ]]; then LX_CUR=""; LX_HAVE=0; fi
        _end_word; C=$((C + 1))
        if [[ "${line:C:1}" == "<" ]]; then
          C=$((C + 1))
          if [[ "${line:C:1}" == "<" ]]; then
            C=$((C + 1)); LX_PEND=3                    # here-string
          else
            [[ "${line:C:1}" == "-" ]] && C=$((C + 1))
            _read_heredoc_delim; LX_PEND=0
          fi
        else
          LX_PEND=2
        fi ;;
      *)
        LX_CUR="$LX_CUR$ch"; LX_HAVE=1; C=$((C + 1)) ;;
    esac
  done
}

_analyze_text() {
  DEPTH=$((DEPTH + 1))
  if (( DEPTH > 8 )); then PARSE_ERROR=1; DEPTH=$((DEPTH - 1)); return; fi
  local -a save_lines
  save_lines=("${LINES[@]}")
  local save_l="$L" save_c="$C"
  local -a save_hd
  save_hd=("${HD[@]}")

  # Re-parsed text (eval, bash -c, a trap or alias body, a heredoc body) is its
  # own command list: not inside the enclosing command's pipeline or case.
  local save_cp="$CASE_PAT" save_term="$LX_TERM"
  _split_lines "$1"
  L=0; C=0; HD=(); CASE_PAT=0; LX_TERM=seq
  _lex_context ""

  LINES=("${save_lines[@]}")
  L="$save_l"; C="$save_c"; HD=("${save_hd[@]}"); CASE_PAT="$save_cp"; LX_TERM="$save_term"
  DEPTH=$((DEPTH - 1))
}

# --- run --------------------------------------------------------------------

# Print a worktree command that works here. Prefer the estate-wt launcher: on
# PATH, beside this hook (agent-estate, reached through symlinks), or in the
# repo. Repos that vendor this hook as a plain file usually have none of these
# (delivery-ops#1088), so fall back to plain `git worktree add`.
_worktree_hint() { # $1 repo top-level ("" when unknown), $2 verb ("edit" / "run it")
  local top="$1" src dir ewt="" c def=""
  if command -v estate-wt >/dev/null 2>&1; then
    ewt=estate-wt
  else
    src=${BASH_SOURCE[0]}
    while [ -L "$src" ]; do
      dir=$(cd -P "$(dirname "$src")" && pwd); src=$(readlink "$src")
      case $src in /*) ;; *) src=$dir/$src ;; esac
    done
    dir=$(cd -P "$(dirname "$src")/.." 2>/dev/null && pwd)
    for c in ${dir:+"$dir/bin/estate-wt"} ${top:+"$top/bin/estate-wt" "$top/.agents/bin/estate-wt"}; do
      if [ -f "$c" ] && [ -x "$c" ]; then ewt=$c; break; fi
    done
  fi
  echo "   Create a worktree first, then $2 there:" >&2
  if [ -n "$ewt" ]; then
    echo "     $ewt -C ${top:-<repo>} new <slug>     (prints the new worktree's path)" >&2
  else
    if [ -n "$top" ]; then
      def=$(git -C "$top" symbolic-ref --quiet --short refs/remotes/origin/HEAD 2>/dev/null)
      def=${def#origin/}
      for c in main master; do
        [ -z "$def" ] && git -C "$top" rev-parse --verify --quiet "refs/remotes/origin/$c" >/dev/null && def=$c
      done
    fi
    echo "     git -C ${top:-<repo>} worktree add .worktrees/<slug> -b <branch> origin/${def:-<default>}" >&2
  fi
}

if (( DEGRADED )); then
  # Old-style, deliberately over-eager substring scan (see note above).
  legacy_re='(^|[;&|[:space:]])(bin/devcontainer-exec|rsync|patch[[:space:]]|sed[[:space:]]+-i|perl[[:space:]]+-i|git[[:space:]]+(stash[[:space:]]+(pop|apply)|apply([[:space:]]|$)|am([[:space:]]|$)|cherry-pick|revert))'
  if [[ "$CMD" =~ $legacy_re ]] && _dir_is_main "$PWD"; then
    echo "❌ Blocked: possible tree-mutating Bash command in the MAIN checkout." >&2
    echo "   jq is not installed, so this guard cannot parse the command" >&2
    echo "   precisely and falls back to a conservative substring scan." >&2
    echo "   Install jq to restore precise matching." >&2
    exit 2
  fi
  exit 0
fi

_analyze_text "$CMD"
# Trap handlers run when the shell exits (or later signals): judge them again
# in the state the line leaves behind.
for _t in "${DEFERRED[@]}"; do _analyze_text "$_t"; done

# A write went to a ~ path (or relative to a cd ~) taken as literal, but HOME
# may change later on the line (in a loop, a later assignment runs first).
if (( ! BLOCKED && TILDE_SEEN && HOME_TAINT )) && _main_in_play; then
  _main_dir
  _block "write to a ~ path on a line that may change HOME" "$RET" nonliteral
fi

if (( BLOCKED )) && [[ "$BLOCK_KIND" == unresolved ]]; then
  echo "❌ Blocked: a Bash write after a directory change this guard cannot resolve." >&2
  echo "   Action:  $BLOCK_WHAT" >&2
  echo "   Command: $CMD" >&2
  echo "" >&2
  echo "   After a cd / pushd / popd whose directory is empty, an option only, an" >&2
  echo "   unknown option, more than one word, a glob, or built from an expansion" >&2
  echo "   (\$VAR, \${…}, \$(…), ~user, {a,b}), the working directory is unknown, so" >&2
  echo "   relative writes and in-place commands after it block wherever the command" >&2
  echo "   runs, even when the variable was set earlier on the same line. cd to a" >&2
  echo "   literal path (cd /abs/path), or give the write an absolute destination." >&2
  if _main_in_play; then
    _main_dir; _nearest_dir "$RET"
    _worktree_hint "$(cd "$RET" 2>/dev/null && git rev-parse --show-toplevel 2>/dev/null)" "run it"
  fi
  exit 2
fi

if (( BLOCKED )) && [[ "$BLOCK_KIND" == nonliteral ]]; then
  echo "❌ Blocked: a Bash write whose destination is built from an expansion," >&2
  echo "   run from a MAIN checkout." >&2
  echo "   Action:   $BLOCK_WHAT" >&2
  echo "   Checkout: $BLOCK_WHERE" >&2
  echo "   Command:  $CMD" >&2
  echo "" >&2
  echo "   From a main checkout every write destination must be a literal path:" >&2
  echo "   no \$VAR, \${…}, \$(…), \$((…)), \$'…', ~user, {a,b} or globs (\$HOME and" >&2
  echo "   \$TMPDIR included). Spell the path out (/tmp/x, ~/.cache/x), or run the" >&2
  echo "   command from a worktree." >&2
  _nearest_dir "$BLOCK_WHERE"
  _worktree_hint "$(cd "$RET" 2>/dev/null && git rev-parse --show-toplevel 2>/dev/null)" "run it"
  exit 2
fi

if (( BLOCKED )); then
  echo "❌ Blocked: tree-mutating Bash command targeting the MAIN checkout." >&2
  echo "   Action:  $BLOCK_WHAT" >&2
  echo "   Target:  $BLOCK_WHERE" >&2
  echo "   Command: $CMD" >&2
  echo "" >&2
  echo "   The worktree-only mandate covers Bash writes too — rsync," >&2
  echo "   bin/devcontainer-exec, git stash pop/apply, git apply, patch, sed -i," >&2
  echo "   plus redirections / tee / cp / mv whose destination is a main checkout." >&2
  _nearest_dir "$BLOCK_WHERE"
  _worktree_hint "$(cd "$RET" 2>/dev/null && git rev-parse --show-toplevel 2>/dev/null)" "run it"
  exit 2
fi

if [[ -n "$UNMOD_WHY" ]] && _main_in_play; then
  _shown "$UNMOD_WHY"
  echo "❌ Blocked: this Bash command uses $RET," >&2
  echo "   which this guard cannot follow, and a MAIN checkout is in play — failing closed." >&2
  echo "   Command: $CMD" >&2
  echo "" >&2
  _top=""
  for _d in "$CURDIR" "$PWD" "$DIR_ALT"; do
    if [[ -n "$_d" ]] && _dir_is_main "$_d"; then
      _nearest_dir "$_d"; _top=$(cd "$RET" 2>/dev/null && git rev-parse --show-toplevel 2>/dev/null); break
    fi
  done
  _worktree_hint "$_top" "run it"
  exit 2
fi

if (( PARSE_ERROR )) && _main_in_play; then
  echo "❌ Blocked: could not parse this Bash command confidently, and a MAIN" >&2
  echo "   checkout is in play — failing closed." >&2
  echo "   Command: $CMD" >&2
  echo "" >&2
  echo "   Simplify the command, or run it from a worktree." >&2
  exit 2
fi

exit 0
