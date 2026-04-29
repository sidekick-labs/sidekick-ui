import type { Preview } from '@storybook/react'
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
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
}

export default preview
