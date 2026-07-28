import type { Preview } from '@storybook/react-vite'
import { useEffect } from 'react'
// Load the full stylesheet (Tailwind + theme tokens + base layer + animations).
// Importing only theme.css gives CSS variables but no utility classes, so
// stories render without Tailwind styling.
import '../src/styles/index.css'

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
