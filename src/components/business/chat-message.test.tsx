import { describe, it, expect } from 'vitest'
import { render, within } from '@testing-library/react'
import { createRef } from 'react'
import { ChatMessage } from './chat-message'

describe('ChatMessage', () => {
  it('renders user message content', () => {
    const { container } = render(<ChatMessage role="user" content="Hello there" />)
    expect(within(container).getByText('Hello there')).toBeInTheDocument()
  })

  it('renders assistant message content', () => {
    const { container } = render(<ChatMessage role="assistant" content="Hi, how can I help?" />)
    expect(within(container).getByText('Hi, how can I help?')).toBeInTheDocument()
  })

  it('renders system message content', () => {
    const { container } = render(<ChatMessage role="system" content="System prompt" />)
    expect(within(container).getByText('System prompt')).toBeInTheDocument()
  })

  it('labels the message group for accessibility', () => {
    const { container } = render(<ChatMessage role="assistant" content="test" />)
    expect(container.firstChild).toHaveAttribute('role', 'group')
    expect(container.firstChild).toHaveAttribute('aria-label', 'Assistant message')
  })

  it('renders avatar icon for user role', () => {
    const { container } = render(<ChatMessage role="user" content="test" />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('renders avatar icon for assistant role', () => {
    const { container } = render(<ChatMessage role="assistant" content="test" />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('renders avatar icon for system role', () => {
    const { container } = render(<ChatMessage role="system" content="test" />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('renders ReactNode content', () => {
    const { container } = render(
      <ChatMessage role="assistant" content={<strong>Bold text</strong>} />,
    )
    expect(within(container).getByText('Bold text')).toBeInTheDocument()
    expect(container.querySelector('strong')).toBeInTheDocument()
  })

  it('renders timestamp when provided', () => {
    const { container } = render(<ChatMessage role="user" content="Hello" timestamp="2:30 PM" />)
    expect(within(container).getByText('2:30 PM')).toBeInTheDocument()
  })

  it('omits timestamp when not provided', () => {
    const { container } = render(<ChatMessage role="user" content="Hello" />)
    expect(within(container).queryByText(/\d{1,2}:\d{2}/)).not.toBeInTheDocument()
  })

  it('renders streaming indicator when isStreaming is true', () => {
    const { container } = render(<ChatMessage role="assistant" content="Thinking" isStreaming />)
    expect(within(container).getByLabelText('Streaming')).toBeInTheDocument()
  })

  it('sets aria-busy on the bubble when streaming', () => {
    const { container } = render(<ChatMessage role="assistant" content="Thinking" isStreaming />)
    const bubble = container.querySelector('[aria-live="polite"]')!
    expect(bubble).toHaveAttribute('aria-busy', 'true')
  })

  it('clears aria-busy when not streaming', () => {
    const { container } = render(<ChatMessage role="assistant" content="Done" />)
    const bubble = container.querySelector('[aria-live="polite"]')!
    expect(bubble).toHaveAttribute('aria-busy', 'false')
  })

  it('does not render streaming indicator by default', () => {
    const { container } = render(<ChatMessage role="assistant" content="Done" />)
    expect(within(container).queryByLabelText('Streaming')).not.toBeInTheDocument()
  })

  it('aligns user messages to the right', () => {
    const { container } = render(<ChatMessage role="user" content="test" />)
    expect((container.firstChild as HTMLElement).className).toContain('justify-end')
  })

  it('aligns assistant messages to the left', () => {
    const { container } = render(<ChatMessage role="assistant" content="test" />)
    expect((container.firstChild as HTMLElement).className).toContain('justify-start')
  })

  it('aligns system messages to the left', () => {
    const { container } = render(<ChatMessage role="system" content="test" />)
    expect((container.firstChild as HTMLElement).className).toContain('justify-start')
  })

  it('places avatar after content for user role', () => {
    const { container } = render(<ChatMessage role="user" content="Hello" />)
    const root = container.firstChild as HTMLElement
    // Avatar should be the last direct child (a div with aria-hidden)
    expect(root.lastElementChild).toHaveAttribute('aria-hidden', 'true')
  })

  it('places avatar before content for assistant role', () => {
    const { container } = render(<ChatMessage role="assistant" content="Hello" />)
    const root = container.firstChild as HTMLElement
    const children = Array.from(root.children)
    const avatarChild = children.find((el) => el.getAttribute('aria-hidden') === 'true')
    const contentDiv = root.querySelector('[aria-live="polite"]')!.parentElement!
    expect(avatarChild).toBeDefined()
    expect(children.indexOf(avatarChild!)).toBeLessThan(children.indexOf(contentDiv))
  })

  it('forwards ref', () => {
    const ref = createRef<HTMLDivElement>()
    render(<ChatMessage ref={ref} role="user" content="test" />)
    expect(ref.current).toBeInstanceOf(HTMLDivElement)
  })

  it('merges custom className', () => {
    const { container } = render(
      <ChatMessage role="user" content="test" className="custom-class" />,
    )
    expect(container.firstChild).toHaveClass('custom-class')
  })
})
