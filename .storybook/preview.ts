import type { Preview } from '@storybook/react'
import React from 'react'
import '../src/styles/theme.css'

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
      return React.createElement(
        'div',
        {
          'data-theme': theme === 'light' ? 'light' : undefined,
          style: {
            backgroundColor: theme === 'light' ? '#ffffff' : '#000000',
            padding: '1rem',
          },
        },
        React.createElement(Story),
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
