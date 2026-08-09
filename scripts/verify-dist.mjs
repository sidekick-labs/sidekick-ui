#!/usr/bin/env node
/*
 * Verify the BUILT `dist/` artifact is publishable — the three guards that
 * stand between a green build and a broken release.
 *
 * Why this is a script and not inline workflow YAML
 * -------------------------------------------------
 * These assertions used to live only in `publish.yml`, which runs on
 * `release: published`. That is the LAST possible moment to discover the
 * problem: the version was already bumped, the tag already pushed, the GitHub
 * Release already created. It has burned a release exactly that way —
 * sidekick-ui#122, where `vite-plugin-dts@5` + a too-new TypeScript rolled the
 * whole public API up to a bare `export { }`. v0.7.0 was tagged and never
 * published.
 *
 * `ci.yml` ran `npm run build` on every PR and asserted nothing about what came
 * out of it, so the PR that broke the rollup was green. Extracting the guards
 * here lets BOTH workflows call the same code: CI catches it on the PR,
 * publish.yml keeps its release-time guarantee. Changing a guard changes it in
 * one place, and it stays runnable locally (`npm run verify:dist`) — which is
 * how you should check a build before pushing.
 *
 * Run it AFTER `npm run build`. It reads only what is on disk (plus
 * `npm pack --dry-run`), never rebuilds, so it verifies the artifact rather
 * than the intent.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const CI = Boolean(process.env.GITHUB_ACTIONS)

let failed = false

/** Emit a GitHub Actions error annotation on CI, a plain line locally. */
function fail(message, detail) {
  console.error(CI ? `::error::${message}` : `FAIL: ${message}`)
  if (detail) {
    if (CI) console.error(`::group::detail`)
    console.error(detail)
    if (CI) console.error(`::endgroup::`)
  }
  failed = true
}

function note(message) {
  console.log(CI ? `::notice::${message}` : `ok: ${message}`)
}

function read(relative) {
  const path = resolve(ROOT, relative)
  return existsSync(path) ? readFileSync(path, 'utf8') : null
}

/* --------------------------------------------------------------------------
 * 1. dist/index.d.ts actually carries the public API's types.
 *
 * Four escalating checks, because a broken type rollup does NOT fail the
 * build — it emits a small, syntactically valid file that publishes fine and
 * silently strips every type from every consumer.
 * ----------------------------------------------------------------------- */
function verifyTypes() {
  const dts = read('dist/index.d.ts')

  if (dts === null) {
    fail(
      'dist/index.d.ts is missing — check vite-plugin-dts config (entryRoot must match build entry directory).',
    )
    return
  }

  if (!/^export/m.test(dts)) {
    fail('dist/index.d.ts contains no exports — type rollup is broken.')
    return
  }

  // The `export {}` killer. A file that contains ONLY an empty export object
  // — and no real declarations — must fail the gate. See sidekick-ui#122.
  const hasRealDeclarations =
    /\bdeclare\b/.test(dts) ||
    /^export[ \t]+(declare|type|interface|function|const|class|default)\b/m.test(dts)
  if (!hasRealDeclarations) {
    fail(
      "dist/index.d.ts has no real type declarations (looks like an empty 'export {}' stub) — type rollup is broken. See sidekick-ui#122.",
      dts.split('\n').slice(0, 40).join('\n'),
    )
    return
  }

  const lines = dts.split('\n').length
  if (lines < 20) {
    fail(
      `dist/index.d.ts is only ${lines} lines — implausibly small for the full public API. Suspect a broken type rollup.`,
      dts,
    )
    return
  }

  note(`dist/index.d.ts has ${lines} lines of exports`)
}

/* --------------------------------------------------------------------------
 * 2. The ./theme export ships RAW, uncompiled tokens.
 *
 * `npm publish --ignore-scripts` means dist/ is whatever the build produced —
 * so verify the artifact, not the intent. The theme entry is only useful to a
 * consumer if it stays an UNCOMPILED @theme block: that is what lets their own
 * Tailwind compose and tree-shake it. A copy that accidentally went through
 * the Tailwind pipeline would still be valid CSS, still publish, and silently
 * stack a second preflight on every consumer.
 * ----------------------------------------------------------------------- */
function verifyTheme() {
  const out = read('dist/styles/theme.css')
  if (out === null) {
    fail(
      'dist/styles/theme.css is missing — the ./theme export would 404. Check scripts/copy-theme.mjs ran in the build.',
    )
    return
  }

  const src = read('src/styles/theme.css')
  if (src === null) {
    fail('src/styles/theme.css is missing — nothing to compare the published tokens against.')
    return
  }

  if (out !== src) {
    fail(
      'dist/styles/theme.css is not byte-identical to src/styles/theme.css — the published tokens would not match the source of truth.',
    )
    return
  }
  if (!out.includes('@theme')) {
    fail('dist/styles/theme.css has no @theme block.')
    return
  }
  if (out.includes('@layer utilities') || out.includes('@property')) {
    fail('dist/styles/theme.css looks Tailwind-COMPILED — it must stay a raw @theme block.')
    return
  }

  note('dist/styles/theme.css is byte-identical to source and uncompiled')
}

/* --------------------------------------------------------------------------
 * 3. The published tarball actually contains the files the exports map points
 *    at. `files: ["dist"]` includes them today, but a future narrowing of that
 *    list would break the ./theme and types exports with no other signal.
 * ----------------------------------------------------------------------- */
const REQUIRED_TARBALL_FILES = ['dist/index.js', 'dist/index.d.ts', 'dist/styles/theme.css']

function verifyTarball() {
  let files
  try {
    const json = execFileSync('npm', ['pack', '--dry-run', '--json'], {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'inherit'],
    })
    files = JSON.parse(json)[0].files.map((f) => f.path)
  } catch (error) {
    fail(`npm pack --dry-run failed — cannot verify tarball contents.`, String(error))
    return
  }

  const missing = REQUIRED_TARBALL_FILES.filter((required) => !files.includes(required))
  if (missing.length > 0) {
    fail(
      `not in the published tarball: ${missing.join(', ')} — check the "files" field in package.json.`,
      files.join('\n'),
    )
    return
  }

  note(`tarball contains ${files.length} files including ${REQUIRED_TARBALL_FILES.join(', ')}`)
}

verifyTypes()
verifyTheme()
verifyTarball()

if (failed) {
  console.error(
    '\nverify-dist: the built package is NOT publishable. Fix the build before releasing.',
  )
  process.exit(1)
}
console.log('\nverify-dist: dist/ is publishable.')
