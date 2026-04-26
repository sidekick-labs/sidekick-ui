import type { Meta, StoryObj } from '@storybook/react'
import { ChatMessage } from './chat-message'

const meta: Meta<typeof ChatMessage> = {
  title: 'Business/ChatMessage',
  component: ChatMessage,
  argTypes: {
    role: { control: 'select', options: ['user', 'assistant', 'system'] },
    isStreaming: { control: 'boolean' },
  },
  parameters: { layout: 'padded' },
}

export default meta
type Story = StoryObj<typeof ChatMessage>

export const Default: Story = {
  args: {
    role: 'assistant',
    content: 'Hello! How can I help you today?',
    timestamp: '10:32 AM',
  },
  render: (args) => (
    <div className="w-[520px]">
      <ChatMessage {...args} />
    </div>
  ),
}

export const UserMessage: Story = {
  args: {
    role: 'user',
    content: 'What is the weather in Tokyo?',
    timestamp: '10:33 AM',
  },
  render: (args) => (
    <div className="w-[520px]">
      <ChatMessage {...args} />
    </div>
  ),
}

export const SystemMessage: Story = {
  args: {
    role: 'system',
    content: 'Conversation started. Tools: weather, search.',
  },
  render: (args) => (
    <div className="w-[520px]">
      <ChatMessage {...args} />
    </div>
  ),
}

export const Streaming: Story = {
  args: {
    role: 'assistant',
    content: 'Thinking through the request and composing a response',
    isStreaming: true,
  },
  render: (args) => (
    <div className="w-[520px]">
      <ChatMessage {...args} />
    </div>
  ),
}

export const Conversation: Story = {
  render: () => (
    <div className="w-[520px] flex flex-col gap-3">
      <ChatMessage role="system" content="New conversation started." />
      <ChatMessage role="user" content="Translate 'good morning' to Japanese." timestamp="10:30" />
      <ChatMessage
        role="assistant"
        content="In Japanese, 'good morning' is おはようございます (ohayou gozaimasu)."
        timestamp="10:30"
      />
      <ChatMessage role="user" content="And in casual form?" timestamp="10:31" />
      <ChatMessage role="assistant" content="Casually, you'd say おはよう (ohayou)." isStreaming />
    </div>
  ),
}
