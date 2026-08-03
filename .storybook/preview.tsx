import type { Decorator, Preview } from '@storybook/react-vite'
import { useEffect } from 'react'
// Load the full stylesheet (Tailwind + theme tokens + base layer + animations).
// Importing only theme.css gives CSS variables but no utility classes, so
// stories render without Tailwind styling.
import '../src/styles/index.css'

/**
 * Freeze animations and transitions — for the TEST RUNNER ONLY.
 *
 * axe measures COMPUTED style. An element that is fading, sliding or pulsing is,
 * for the length of that animation, a different element than the one that
 * ships: partly transparent, partly offset, composited against whatever is
 * behind it. A contrast reading taken mid-animation is therefore a reading of a
 * frame no user settles on, and it is a different number on every run.
 *
 * The failure mode this prevents was observed on `fundbright-web`: an entry-
 * animated banner carried a deterministic 2.17:1 contrast failure that the gate
 * FAILED on one PR and PASSED on `main` with byte-identical code, so a real
 * violation reached production through a green pipeline. A green run has to mean
 * "no violations", never "axe happened not to see them this time".
 *
 * `1ms` rather than `none`, deliberately: `animation: none` can leave an element
 * at its PRE-animation base state, which for an entry animation is the invisible
 * one — trading a random frame for a guaranteed-wrong frame. Running the
 * animation to completion in 1ms with a negative delay lands every element on
 * its FINAL frame instead, which is the state that ships.
 *
 * Gated on the runner so interactive Storybook keeps its animations. That
 * matters more here than in an app repo: this Storybook is the published,
 * browsable catalog for `@sidekick-labs/ui`, and motion is a design property
 * reviewers are supposed to see. Only the gate needs a still frame.
 * `__vitest_worker__` is the same discriminator the audit-matrix tripwire uses
 * to read its instance name.
 *
 * This is test-surface only — `.storybook/` is not part of the published
 * package, so no consumer inherits it.
 *
 * The freeze fails SILENTLY if it stops applying: stories just go back to being
 * flaky, which reads as ordinary CI noise and gets retried rather than
 * investigated. `FreezesEntryAnimations` in `src/test/audit-matrix.stories.tsx`
 * asserts it is live.
 */
const FROZEN_MOTION_STYLE_ID = 'sb-frozen-motion'

const withFrozenMotion: Decorator = (Story) => {
  const underTestRunner = '__vitest_worker__' in globalThis
  if (underTestRunner && !document.getElementById(FROZEN_MOTION_STYLE_ID)) {
    const style = document.createElement('style')
    style.id = FROZEN_MOTION_STYLE_ID
    style.textContent = `*, *::before, *::after {
      animation-delay: -1ms !important;
      animation-duration: 1ms !important;
      animation-iteration-count: 1 !important;
      transition-delay: -1ms !important;
      transition-duration: 1ms !important;
      scroll-behavior: auto !important;
    }`
    document.head.appendChild(style)
  }
  return <Story />
}

const preview: Preview = {
  tags: ['autodocs'],
  globalTypes: {
    theme: {
      description: 'Theme for components',
      toolbar: {
        title: 'Theme',
        icon: 'paintbrush',
        items: [
          { value: 'dark', title: 'Dark', icon: 'moon' },
          { value: 'light', title: 'Light', icon: 'sun' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: 'dark',
  },
  decorators: [
    (Story, context) => {
      const theme = context.globals.theme || 'dark'

      // Paint the CANVAS, not just the story's own box.
      //
      // The wrapper below only paints as wide as itself. Several stories are
      // deliberately wider than a phone viewport (DataTable pins `w-[640px]`),
      // so at 414px their right-hand columns overhang the wrapper and sit on
      // the bare `body` — which this design system never gives a background,
      // because painting the canvas is the consuming app's job. axe then
      // measures those cells against the browser default WHITE and reports
      // contrast failures for dark-theme foreground tokens that are actually
      // fine (#22c55e/#f87171/#f59e0b/#d4d4d4 on #000000 all pass).
      //
      // That is a defect in the story surface, not in the components — the
      // exact failure mode the workspace a11y convention warns about, and it
      // only becomes visible once a genuinely narrow instance runs. Mirroring
      // the theme onto <html> and painting <body> makes the measurement honest.
      //
      // Storybook-only: `.storybook/preview.tsx` is not part of the published
      // package, so no consumer inherits a `body` background from this.
      //
      // Scoped to the Vitest browser run on purpose. The Playwright
      // visual-regression job (`e2e/storybook.spec.ts`) takes FULL-PAGE
      // screenshots of the preview iframe against 14 committed
      // `*-chromium-linux` baselines, so painting <body> unconditionally would
      // invalidate every one of them — and they cannot be correctly
      // regenerated from a macOS dev box, which writes `*-darwin` files and
      // passes without ever comparing. The a11y gate needs an honest canvas;
      // the screenshots need their existing one. Both get what they need.
      useEffect(() => {
        if (!(globalThis as { __vitest_browser__?: boolean }).__vitest_browser__) return
        const root = document.documentElement
        if (theme === 'light') root.setAttribute('data-theme', 'light')
        else root.removeAttribute('data-theme')
        document.body.style.backgroundColor = 'var(--color-background)'
      }, [theme])

      return (
        <div
          data-theme={theme === 'light' ? 'light' : undefined}
          style={{ backgroundColor: 'var(--color-background)', padding: '1rem' }}
        >
          <Story />
        </div>
      )
    },
    withFrozenMotion,
  ],
  parameters: {
    layout: 'centered',
    // The two widths the a11y gate sweeps.
    //
    // This, NOT `browser.instances[].viewport` in vitest.config.ts, is the knob
    // that actually moves the audit width: `@storybook/addon-vitest` resolves a
    // story's viewport from `globals.viewport.value`, looked up in
    // MINIMAL_VIEWPORTS merged with these `options`, then calls
    // `page.viewport()` itself before the axe pass. The Vitest-level viewport is
    // a silent no-op — see the long note in vitest.config.ts. Each browser
    // instance pins one of these via `provide`.
    viewport: {
      options: {
        phone: { name: 'Phone', styles: { width: '414px', height: '896px' } },
        desktop: { name: 'Desktop', styles: { width: '1280px', height: '720px' } },
      },
    },
    a11y: {
      // Fail the `storybook` Vitest project (CI `a11y` job) on ANY axe
      // violation. addon-vitest has no impact tiering — see the `storybook`
      // skill for the policy and the per-story scope-disable escape hatch.
      test: 'error',
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
}

export default preview
