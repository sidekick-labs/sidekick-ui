#!/usr/bin/env node
/*
 * Ship src/styles/theme.css as dist/styles/theme.css — the RAW design tokens,
 * importable on their own via the `./theme` export.
 *
 * Why this exists
 * ---------------
 * `vite build` compiles src/styles/index.css (which @imports theme.css) into
 * dist/styles/index.css — a complete ~56KB Tailwind build: 44 `@property`
 * rules, a 10.9KB `@layer base` preflight and 35.3KB of `@layer utilities`.
 * That artifact is correct for a consumer with no Tailwind of its own, but it
 * is unusable for one that compiles its own: importing it stacks a second
 * Tailwind and a duplicate preflight on top of theirs. Measured against
 * sidekick-web's real entry, `@import '@sidekick-labs/ui/styles'` costs
 * +47% raw / +8.9KB gzip; the theme-only import is -672 bytes.
 *
 * Until now there was no third option, because `files: ["dist"]` means the raw
 * theme.css was never published at all. So the only way to get these tokens
 * into an app that already runs Tailwind was to COPY them — which is exactly
 * what sidekick-web and sidekick-harness did, and those forks then drifted
 * (see the "Re-synced VERBATIM from @sidekick-labs/ui 0.9.0" comments littered
 * through both apps' application.css, each one a manual copy that had to be
 * done by hand and could silently fall behind).
 *
 * dist/styles/theme.css closes that hole. A consumer with its own Tailwind can:
 *
 *     @import 'tailwindcss';
 *     @import '@sidekick-labs/ui/theme';
 *
 * and get the `@theme` block plus the `[data-theme='light']` overrides only —
 * one Tailwind, one preflight, tokens shared by reference instead of by
 * copy-paste. Crucially the file must NOT go through the Tailwind pipeline: it
 * has to stay an uncompiled `@theme` block so the consumer's own Tailwind can
 * compose it and tree-shake the tokens it does not reference.
 *
 * Kept as a plain copy (no bundler plugin) so the published file is
 * byte-identical to the source of truth, and a diff between them is always
 * empty or a real bug.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SRC = resolve(ROOT, 'src/styles/theme.css')
const OUT_DIR = resolve(ROOT, 'dist/styles')
const OUT = resolve(OUT_DIR, 'theme.css')

if (!existsSync(SRC)) {
  console.error(`copy-theme: source missing: ${SRC}`)
  process.exit(1)
}
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true })

copyFileSync(SRC, OUT)

// Guard the contract rather than trust it: the published file must actually
// carry the tokens, uncompiled. An empty, @theme-less, or Tailwind-compiled
// copy would fail silently in every consumer.
const src = readFileSync(SRC, 'utf8')
const out = readFileSync(OUT, 'utf8')

if (out !== src) {
  console.error('copy-theme: dist/styles/theme.css is not byte-identical to source')
  process.exit(1)
}
if (!out.includes('@theme')) {
  console.error(
    'copy-theme: dist/styles/theme.css has no @theme block — refusing to publish a themeless theme',
  )
  process.exit(1)
}
if (!out.includes("[data-theme='light']")) {
  console.error(
    "copy-theme: dist/styles/theme.css has no [data-theme='light'] block — the light theme would not propagate",
  )
  process.exit(1)
}
// A compiled stylesheet would carry preflight/utilities; the raw token file
// must not. This is the guard that catches the file being routed through the
// Tailwind pipeline by accident.
if (out.includes('@layer utilities') || out.includes('@property')) {
  console.error(
    'copy-theme: dist/styles/theme.css looks Tailwind-COMPILED (found @layer utilities / @property) — it must stay a raw @theme block so consumers can compose and tree-shake it',
  )
  process.exit(1)
}

const tokens = (out.match(/^\s*--[a-z0-9-]+:/gim) || []).length
if (tokens === 0) {
  console.error('copy-theme: dist/styles/theme.css defines no custom properties')
  process.exit(1)
}
console.log(`copy-theme: dist/styles/theme.css (${tokens} token declarations, ${out.length} bytes)`)
