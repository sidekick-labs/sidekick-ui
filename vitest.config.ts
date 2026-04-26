/// <reference types="vitest" />
import { defaultExclude, defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: [...defaultExclude, '.worktrees/**', '.claude/worktrees/**'],
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
  },
})
