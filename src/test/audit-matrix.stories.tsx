import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'

/**
 * The tripwire for the a11y gate's audit matrix.
 *
 * KEEP THESE STORIES. They are not demos and they are not throwaway — they are
 * the only signal that the matrix is still doing anything.
 *
 * The gate runs every story four times, once per browser instance:
 * {phone, desktop} x {dark, light}. Both axes are pinned the same way — by
 * Storybook globals supplied per instance through `provide` in
 * vitest.config.ts, resolved against `.storybook/preview.tsx` (the
 * `phone`/`desktop` viewport presets and the `theme` globalType).
 *
 * Neither axis is set by anything Vitest-level. `browser.instances[].viewport`
 * is inert: `@vitest/browser-playwright` 4.1.x has its viewport line commented
 * out, and `@storybook/addon-vitest` calls `page.viewport()` itself before every
 * story anyway, defaulting to a hardcoded 1200x900.
 *
 * That wiring is load-bearing, non-obvious, and it fails SILENTLY — a dependency
 * bump that changes the provide key, the globals' shape, or `setViewport()`'s
 * precedence collapses every instance back to the defaults while every other
 * story still passes and the test count is still exactly 4x the catalog. This
 * repo has already shipped that state once: 336 tests, both instances at
 * 1200x900. If either story below fails, the matrix is dead — fix the wiring, do
 * NOT widen the assertion.
 *
 * Both stories cross-check against the Vitest instance NAME, which is the one
 * part of the setup a fallback cannot fake: an instance called
 * `storybook-mobile-light` that renders 1280px wide in dark is, by definition,
 * not doing its job.
 */
const AuditMatrix = () => (
  <p>
    Asserts the a11y gate is really auditing two widths and two themes. See the comment in this file
    before changing anything.
  </p>
)

const meta: Meta<typeof AuditMatrix> = {
  title: 'Internals/Audit Matrix',
  component: AuditMatrix,
}

export default meta

/** e.g. `storybook-mobile-light` -> `['mobile', 'light']`. */
function instanceAxes(): [string, string] {
  const name = (globalThis as { __vitest_worker__?: { config?: { name?: string } } })
    .__vitest_worker__?.config?.name
  const match = /^storybook-(mobile|desktop)-(dark|light)$/.exec(name ?? '')
  if (!match) throw new Error(`Unrecognised Vitest instance name: ${String(name)}`)
  return [match[1], match[2]]
}

export const AuditsBothWidths: StoryObj<typeof AuditMatrix> = {
  play: async () => {
    const [width] = instanceAxes()
    // 1200 is the addon's un-overridden default and means the wiring is dead.
    await expect(window.innerWidth).toBe(width === 'mobile' ? 414 : 1280)
  },
}

/**
 * The theme half of the tripwire, and it needs more than the width half does.
 *
 * A dead width axis is self-evident: it reports 1200, a value no instance ever
 * asks for. A dead THEME axis is not — its failure mode is every instance
 * silently falling back to `initialGlobals.theme = 'dark'`, which is a
 * perfectly legitimate value. Asserting `globals.theme` is one of two allowed
 * strings would pass in exactly the broken state it exists to catch, which is
 * why the expectation is derived from the instance name instead.
 *
 * It then asserts the CONSEQUENCE too: that the theme global actually reaches
 * the DOM axe measures. The preview decorator mirrors the theme onto `<html>`
 * and paints `<body>` under Vitest, so the resolved canvas colour and the
 * resolved token are a direct readout of whether the global was applied. If the
 * global says `light` but the canvas is still #000000, the decorator or the
 * `[data-theme='light']` block in theme.css has broken, and every light-theme
 * "pass" is really measuring dark tokens.
 *
 * Together with the light instances existing at all, this is what stops
 * sidekick-labs/product-brain#297 — 62 contrast violations accumulated in a
 * theme nothing ever audited — from happening a second time.
 */
export const AuditsBothThemes: StoryObj<typeof AuditMatrix> = {
  play: async ({ globals }) => {
    const [, theme] = instanceAxes()
    await expect(globals.theme).toBe(theme)

    const canvas = getComputedStyle(document.body).backgroundColor
    await expect(canvas).toBe(theme === 'light' ? 'rgb(255, 255, 255)' : 'rgb(0, 0, 0)')

    // ...and the light overrides really resolve, not just the data-attribute.
    const primaryText = getComputedStyle(document.documentElement)
      .getPropertyValue('--color-primary-text')
      .trim()
    await expect(primaryText).toBe(theme === 'light' ? '#497000' : '#b7ff31')
  },
}
