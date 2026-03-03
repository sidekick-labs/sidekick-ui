import type { Preview } from '@storybook/react'
import '../src/styles/theme.css'

const preview: Preview = {
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    backgrounds: {
      values: [
        { name: 'Light', value: '#ffffff' },
        { name: 'Dark', value: '#111113' },
      ],
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
