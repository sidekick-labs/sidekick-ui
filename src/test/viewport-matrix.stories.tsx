import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'

/**
 * The tripwire for the a11y gate's viewport matrix.
 *
 * KEEP THIS STORY. It is not a demo and it is not throwaway — it is the only
 * signal that the matrix is still doing anything.
 *
 * The gate runs every story twice, once per browser instance, at a phone width
 * and a desktop width. That width is NOT set by `browser.instances[].viewport`
 * in vitest.config.ts — that key is inert, because `@vitest/browser-playwright`
 * 4.1.x has its viewport line commented out and `@storybook/addon-vitest` calls
 * `page.viewport()` itself before every story anyway, defaulting to a hardcoded
 * 1200x900. The width is pinned instead by a Storybook viewport global, per
 * instance, via `provide`, resolved against the `phone` / `desktop` presets in
 * `.storybook/preview.tsx`.
 *
 * That wiring is load-bearing and non-obvious, and it fails SILENTLY: a
 * dependency bump that changes the provide key, the global's shape, or
 * `setViewport()`'s precedence collapses both instances back to 1200x900 — and
 * every other story still passes, and the test count is still exactly 2x the
 * catalog. This repo shipped exactly that state: 336 tests, both instances at
 * 1200x900.
 *
 * So the width is asserted directly. If this story ever fails reporting 1200,
 * the matrix is dead and every "zero violations" result is a desktop-only
 * result. Fix the wiring — do NOT widen the assertion.
 */
const ViewportMatrix = () => (
  <p>
    Asserts the a11y gate is really auditing two different widths. See the comment in this file
    before changing anything.
  </p>
)

const meta: Meta<typeof ViewportMatrix> = {
  title: 'Internals/Viewport Matrix',
  component: ViewportMatrix,
}

export default meta

export const AuditsBothWidths: StoryObj<typeof ViewportMatrix> = {
  play: async () => {
    // 1200 is the addon's un-overridden default and means the wiring is dead.
    await expect([414, 1280]).toContain(window.innerWidth)
  },
}
