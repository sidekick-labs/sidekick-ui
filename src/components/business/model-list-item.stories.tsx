import type { Meta, StoryObj } from '@storybook/react'
import { fn } from 'storybook/test'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ModelListItem } from './model-list-item'

const meta: Meta<typeof ModelListItem> = {
  title: 'Business/ModelListItem',
  component: ModelListItem,
  decorators: [
    (Story) => (
      <TooltipProvider>
        <div className="w-[640px] border border-[var(--color-border)] rounded-lg">
          <Story />
        </div>
      </TooltipProvider>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof ModelListItem>

export const Default: Story = {
  args: {
    model: {
      id: 'gpt-4o',
      name: 'GPT-4o',
      provider: 'OpenAI',
      family: 'GPT-4',
      contextWindow: 128_000,
      maxOutputTokens: 16_384,
      capabilities: ['streaming', 'function_calling', 'vision'],
      pricing: { inputTokenCost: '5.00', outputTokenCost: '15.00' },
      knowledgeCutoff: '2024-10',
    },
  },
}

export const Selected: Story = {
  args: {
    selected: true,
    onSelect: fn(),
    model: {
      id: 'claude-opus',
      name: 'Claude Opus 4.7',
      provider: 'Anthropic',
      family: 'Claude 4',
      contextWindow: 1_000_000,
      maxOutputTokens: 64_000,
      capabilities: ['streaming', 'function_calling', 'vision', 'batch'],
      pricing: { inputTokenCost: '15.00', outputTokenCost: '75.00' },
      knowledgeCutoff: '2026-01',
    },
  },
}

export const Minimal: Story = {
  args: {
    model: {
      id: 'llama-3-8b',
      name: 'Llama 3 8B',
      provider: 'Ollama',
    },
  },
}

export const Selectable: Story = {
  args: {
    onSelect: fn(),
    model: {
      id: 'gemini-2-flash',
      name: 'Gemini 2.0 Flash',
      provider: 'Google',
      family: 'Gemini',
      contextWindow: 1_048_576,
      capabilities: ['streaming', 'vision'],
    },
  },
}

export const ListOfModels: Story = {
  render: () => (
    <>
      <ModelListItem
        model={{
          id: 'gpt-4o',
          name: 'GPT-4o',
          provider: 'OpenAI',
          contextWindow: 128_000,
          capabilities: ['streaming', 'function_calling', 'vision'],
          pricing: { inputTokenCost: '5.00', outputTokenCost: '15.00' },
        }}
        onSelect={fn()}
      />
      <ModelListItem
        selected
        onSelect={fn()}
        model={{
          id: 'claude-opus',
          name: 'Claude Opus 4.7',
          provider: 'Anthropic',
          contextWindow: 1_000_000,
          capabilities: ['streaming', 'function_calling', 'vision', 'batch'],
          pricing: { inputTokenCost: '15.00', outputTokenCost: '75.00' },
        }}
      />
      <ModelListItem
        model={{
          id: 'llama-3-8b',
          name: 'Llama 3 8B',
          provider: 'Ollama',
          family: 'Llama 3',
        }}
        onSelect={fn()}
      />
    </>
  ),
}
