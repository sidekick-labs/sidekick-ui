import type { Meta, StoryObj } from '@storybook/react-vite'
import type { CSSProperties } from 'react'
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
 *
 * `FreezesEntryAnimations` covers a third property of the gate that is not about
 * coverage but about determinism: whether the frame axe samples is the settled
 * one. It fails silently in the same way, so it lives here.
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

/**
 * Carries this library's REAL entry animation, not a hand-written `@keyframes`.
 *
 * `--animate-fade-in` in `theme.css` resolves to the `fade-in` keyframes in
 * `animations.css` (`opacity: 0` + `translateY(-1rem)` -> `opacity: 1`). It is
 * the mechanism the package actually ships for entry motion — sidekick-web's
 * `FlashMessages` drives its flash banners off exactly this token, via the
 * `./theme` export. A bespoke animation here would let the tripwire keep passing
 * after a Tailwind or token change moved the mechanism out from under it.
 *
 * This covers the `@theme`-token half of the library's entry motion. The Radix
 * overlays run on a different engine and are covered separately by
 * `OverlayMotionProbe` below — read that note before assuming they are
 * redundant.
 *
 * Applied as an inline `animation: var(--animate-fade-in)` rather than through
 * the matching Tailwind utility, and that is REQUIRED, not a shortcut. Tailwind
 * v4's automatic source detection scans this file as raw text, and
 * `vite.config.ts` compiles `src/styles/index.css` into the PUBLISHED
 * `dist/styles/index.css` — so naming that utility here, even inside a comment,
 * emitted a rule for it into the shipped bundle. `index.css` therefore excludes
 * this file from source detection, which means a utility class written here
 * would never be GENERATED: the probe would silently lose its animation and this
 * tripwire would pass unconditionally. Read the `@source not` note in
 * `src/styles/index.css` before changing either half.
 *
 * The token and the keyframes are the parts that have to stay real, and both do:
 * `--animate-fade-in` from `theme.css`, `@keyframes fade-in` from
 * `animations.css`.
 *
 * Colours are pinned inline so the probe can never itself trip the contrast
 * gate, in either theme.
 */
function MotionProbe() {
  return (
    <output
      data-testid="motion-probe"
      style={{
        animation: 'var(--animate-fade-in)',
        backgroundColor: '#ffffff',
        color: '#000000',
      }}
    >
      Motion probe — asserts the gate samples settled frames, not mid-animation ones.
    </output>
  )
}

/**
 * The OVERLAY entry animation — the one the dialogs, menus, popovers and
 * tooltips actually run.
 *
 * These are a second, independent engine. `MotionProbe` above rides
 * `--animate-fade-in`, a `@theme` token this repo defines against its own
 * `@keyframes fade-in`. The overlays instead carry `animate-in` / `fade-in-0` /
 * `zoom-in-95` / `slide-in-from-*` utilities, which resolve through
 * `tw-animate-css` to the vendor's `enter` keyframes driven by
 * `--tw-enter-opacity` / `--tw-enter-scale` / `--tw-enter-translate-*`. Freezing
 * one says nothing about the other, so both are probed.
 *
 * Historically this probe could not exist. No animation plugin was installed at
 * all, so every one of those utilities compiled to nothing — the pre-fix
 * `dist/styles/index.css` contained no `.animate-in` rule, and a probe on them
 * would have asserted on dead classes and passed unconditionally. Installing
 * `tw-animate-css` made the overlays animate for the first time, which is
 * exactly what puts them in scope for the freeze.
 *
 * Written as an inline `animation: 'enter …'` with the enter custom properties
 * set by hand, NOT as `className="animate-in fade-in-0 zoom-in-95"`, and that is
 * REQUIRED. `src/styles/index.css` carries `@source not` for this file, so a
 * utility class named here is never GENERATED. It would resolve today only
 * because `tooltip.tsx` happens to use the same three bare — and would silently
 * become inert the moment that changed, leaving a tripwire that passes
 * unconditionally. `var(--animate-in)` is no better: `tw-animate-css` declares it
 * in an `@theme inline` block, so it is substituted into the utility and never
 * emitted as a variable. Verified against the built CSS — there is no
 * `--animate-in:` declaration in `dist/styles/index.css`.
 *
 * What stays real is the part that matters: `@keyframes enter` and the
 * `--tw-enter-*` registered properties both come from `tw-animate-css` itself,
 * so if that import is dropped from `index.css` the animation stops resolving
 * and the numbers below move.
 *
 * The values mirror the overlays' own: opacity 0 (`fade-in-0`), scale 95%
 * (`zoom-in-95`), and a 2-spacing-unit vertical offset
 * (`slide-in-from-top-2`). Colours pinned inline so the probe can never itself
 * trip the contrast gate.
 */
function OverlayMotionProbe() {
  return (
    <output
      data-testid="overlay-motion-probe"
      style={
        {
          animation: 'enter 0.15s ease',
          '--tw-enter-opacity': 0,
          '--tw-enter-scale': '95%',
          '--tw-enter-translate-y': 'calc(2 * var(--spacing) * -1)',
          backgroundColor: '#ffffff',
          color: '#000000',
        } as CSSProperties
      }
    >
      Overlay motion probe — the dialog/menu/popover/tooltip entry animation.
    </output>
  )
}

/**
 * The gate must sample SETTLED frames — this is what makes a green run mean
 * something.
 *
 * axe reads computed style. While an element is fading or sliding in it is
 * partly transparent and partly offset, so its contrast is a different number
 * than the one that ships — and a different number on each run, depending on
 * where the sample lands in the animation. On `fundbright-web` that produced the
 * worst possible outcome: an entry-animated banner's 2.17:1 button FAILED the
 * gate on one PR and PASSED on `main` with byte-identical code, so a real
 * violation reached production through a green pipeline.
 *
 * `.storybook/preview.tsx` fixes this by collapsing every animation and
 * transition to 1ms with a negative delay under the test runner, landing each
 * element on its final frame. This story asserts that freeze is actually in
 * effect, because if it silently stops applying the symptom is not a failure —
 * it is a return to intermittent flakiness, which reads as ordinary CI noise.
 *
 * The assertion is on RENDERED OPACITY, not on the presence of the style tag.
 * The tag existing proves nothing about whether its rule won the cascade;
 * opacity is the property axe actually consumes.
 *
 * Negative control: with the freeze defeated, this story must fail — on BOTH
 * probes. Re-verified when the overlay probe was added, by a throwaway story
 * that beat the freeze on selector specificity (`[data-testid=…]` with
 * `!important` outranks the decorator's `*`) and stretched the animations to
 * 5s. That is a tighter control than deleting `withFrozenMotion`: it leaves the
 * gate's own configuration untouched and isolates the two probes.
 *
 * Measured, unfrozen:
 *
 *   fade probe     opacity 0.00568443  duration 5s  transform matrix(1, 0, 0, 1, 0, -15.909)
 *   overlay probe  opacity 0.0013869   duration 5s  transform matrix3d(scale 0.950069, translateY -7.9889)
 *
 * Every assertion below moves. Both elements are effectively invisible — which
 * is why the result is a coin flip rather than a consistently wrong number: at
 * ~0 opacity there is barely any colour to measure, so whether a contrast
 * violation gets reported at all depends on where the sample lands. The overlay
 * probe additionally reads mid-zoom and mid-slide, so its POSITION is wrong too.
 *
 * If you change the freeze, re-run that check; a tripwire that has never been
 * seen to fail is not a tripwire.
 *
 * One latent dependency in the `transform` assertion, called out because it
 * would fail SILENTLY: it expects `none`, which holds only under the default
 * `animation-fill-mode: none` — properties revert to base style once the
 * animation ends, and neither probe declares a `transform` of its own. The
 * freeze does not touch fill-mode. Give either animation `forwards` and the
 * settled reading becomes the keyframe's own value (`matrix(1, 0, 0, 1, 0, 0)`
 * for the fade probe's `translateY(0)`), so the assertion starts failing on a
 * correctly-frozen element. Relax it to accept the identity matrix then —
 * do not drop it.
 */
export const FreezesEntryAnimations: StoryObj<typeof AuditMatrix> = {
  render: () => (
    <>
      <MotionProbe />
      <OverlayMotionProbe />
    </>
  ),
  play: async ({ canvas }) => {
    for (const testId of ['motion-probe', 'overlay-motion-probe']) {
      const computed = getComputedStyle(canvas.getByTestId(testId))

      // The frame axe would measure. Anything below 1 is a frame no user settles
      // on, and a contrast reading taken from it is meaningless.
      await expect(computed.opacity, `${testId} opacity`).toBe('1')

      // Belt and braces on the mechanism itself: an animation still declared as
      // running at its authored duration would drift back to flaky even if this
      // particular sample happened to land at full opacity.
      await expect(computed.animationDuration, `${testId} duration`).toBe('0.001s')

      // The overlays translate and scale as well as fade, and axe reads position
      // too. A settled overlay sits at its final transform; mid-animation it is
      // offset and shrunk, which is a different element from the one that ships.
      await expect(computed.transform, `${testId} transform`).toBe('none')
    }
  },
}
