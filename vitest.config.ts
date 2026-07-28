/// <reference types="vitest" />
import { defaultExclude, defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'
import { playwright } from '@vitest/browser-playwright'
import { resolve } from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  test: {
    coverage: {
      provider: 'v8',
      all: true,
      include: ['src/components/**', 'src/hooks/**'],
      exclude: [
        'src/test/**',
        'src/components/index.ts',
        'src/components/**/*.stories.{ts,tsx}',
        'src/components/**/*.test.{ts,tsx}',
      ],
      // Scoped thresholds: only enforce on components/hooks. Other folders
      // (src/lib, src/types) are intentionally excluded — they are either
      // covered by their own colocated tests or are type-only modules where
      // a coverage threshold would be misleading.
      thresholds: {
        'src/components/**': {
          lines: 80,
          functions: 80,
          statements: 80,
          branches: 70,
        },
        'src/hooks/**': {
          lines: 80,
          functions: 80,
          statements: 80,
          branches: 70,
        },
      },
    },
    projects: [
      // Unit + jsdom a11y tests (vitest-axe). This is the project the pre-push
      // hook and `npm run test:run` exercise.
      {
        plugins: [react()],
        resolve: {
          alias: {
            '@': resolve(__dirname, './src'),
          },
        },
        test: {
          name: 'unit',
          environment: 'jsdom',
          setupFiles: ['./src/test/setup.ts'],
          include: ['src/**/*.{test,spec}.{ts,tsx}'],
          exclude: [...defaultExclude, '.worktrees/**', '.claude/worktrees/**', 'e2e/**'],
        },
      },
      // Every story runs as a test in a real browser (Playwright Chromium):
      // mounts the story (render-smoke), runs its `play` function if present,
      // and runs the addon-a11y axe check per `parameters.a11y.test` set in
      // .storybook/preview.tsx. Replaces the old @storybook/test-runner gate.
      {
        extends: true,
        plugins: [
          storybookTest({
            configDir: resolve(__dirname, '.storybook'),
            storybookScript: 'npm run storybook -- --ci',
          }),
        ],
        resolve: {
          alias: {
            '@': resolve(__dirname, './src'),
          },
        },
        test: {
          name: 'storybook',
          // The first story in each file absorbs that file's browser-side
          // module compile/transform time, which regularly exceeds the 15s
          // default on a cold Vite cache (and on CI runners). Give it room —
          // stories themselves execute in milliseconds.
          //
          // 120s, not 60s, since the viewport matrix below doubles the number
          // of browser contexts competing for a 2-core CI runner: the binding
          // constraint is stories sitting QUEUED while their clock runs, not
          // slow stories. Sibling repos (sidekick-web, luminality-web) were
          // still flaky at 60s with half this load.
          testTimeout: 120_000,
          // Two instances double the concurrent browser contexts, and the
          // default worker count is per-instance. Left unbounded this is
          // SLOWER, not faster, and on a loaded machine it collapses outright
          // ("Cannot connect to the server in 60 seconds" on every file, which
          // reads like a timeout but is saturation). Measured on this repo's 68
          // story files: uncapped 21.4s, 4 workers 11.9s, 3 workers 11.7s.
          // 3 and 4 are within noise here; `3` matches firsttofly-myboard while
          // jumpdrive-web, fundbright-web and sidekick-harness landed on 4.
          // Re-measure before changing it, and never lower `testTimeout`.
          maxWorkers: 3,
          browser: {
            enabled: true,
            provider: playwright(),
            headless: true,
            // Every story is audited at BOTH a phone and a desktop width.
            //
            // axe measures the DOM as rendered, so a single viewport only ever
            // audits one side of every `md:`/`lg:` breakpoint — the design
            // system's responsive DataTable headers, wide Pagination and
            // multi-column layouts on one side, the collapsed rendering on the
            // other. Neither width is a baseline on its own.
            //
            // The width is pinned by a STORYBOOK VIEWPORT GLOBAL, per instance,
            // via `provide` — NOT by `browser.instances[].viewport`, which this
            // config used until now and which is INERT. Two things override it:
            // `@vitest/browser-playwright` 4.1.x has its
            // `options.viewport ??= this.project.config.browser.viewport` line
            // commented out behind a TODO, so `browser.viewport` never reaches
            // the Playwright context at all; and `@storybook/addon-vitest` calls
            // `page.viewport()` itself before every story, defaulting to its
            // hardcoded 1200x900.
            //
            // Measured with a throwaway story reporting `window.innerWidth`:
            // with the old `viewport` keys BOTH instances rendered at 1200x900
            // — 336 tests, double the CI cost, and zero added coverage. With
            // the `provide` form below they report 414 and 1280.
            //
            // The two presets are declared in `.storybook/preview.tsx`.
            //
            // Instances of the same browser need distinct `name`s, or the two
            // derived projects collide as `storybook (chromium)`
            // (storybookjs/storybook#32427).
            //
            // This does NOT affect the Playwright visual-regression job: that
            // runs from `playwright.config.ts` via `e2e.yml` against the
            // committed `*-chromium-linux` baselines and shares no config with
            // this project.
            instances: [
              {
                browser: 'chromium',
                name: 'storybook-mobile',
                provide: {
                  'storybook/test-initial-globals': { viewport: { value: 'phone' } },
                },
              },
              {
                browser: 'chromium',
                name: 'storybook-desktop',
                provide: {
                  'storybook/test-initial-globals': { viewport: { value: 'desktop' } },
                },
              },
            ],
          },
        },
      },
    ],
  },
})
