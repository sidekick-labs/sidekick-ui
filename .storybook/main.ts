import type { StorybookConfig } from '@storybook/react-vite'
import tailwindcss from '@tailwindcss/vite'

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-a11y'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  // Storybook runs its own Vite pipeline, so the Tailwind plugin from
  // vite.config.ts isn't picked up automatically. Without this hook,
  // `@import 'tailwindcss'` in src/styles/index.css is a no-op and stories
  // render unstyled — making visual regression baselines meaningless.
  viteFinal: async (config) => {
    config.plugins = [...(config.plugins ?? []), tailwindcss()]
    return config
  },
}

export default config
