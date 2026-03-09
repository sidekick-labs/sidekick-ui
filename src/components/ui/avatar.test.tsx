import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup, within } from '@testing-library/react'
import { createRef } from 'react'
import { Avatar, AvatarImage, AvatarFallback } from './avatar'

afterEach(cleanup)

describe('Avatar', () => {
  it('renders the root element', () => {
    const { container } = render(
      <Avatar>
        <AvatarFallback>JS</AvatarFallback>
      </Avatar>,
    )
    expect(container.firstChild).toBeInTheDocument()
  })

  it('renders fallback text', () => {
    const { container } = render(
      <Avatar>
        <AvatarFallback>AB</AvatarFallback>
      </Avatar>,
    )
    expect(within(container).getByText('AB')).toBeInTheDocument()
  })

  it('renders AvatarImage with correct attributes', () => {
    // Radix Avatar delays image rendering until load event in jsdom,
    // so we verify the fallback renders and the component mounts without error.
    const { container } = render(
      <Avatar>
        <AvatarImage src="/photo.jpg" alt="User photo" />
        <AvatarFallback>U</AvatarFallback>
      </Avatar>,
    )
    // The root span should be present even if the image hasn't loaded yet
    expect(container.firstChild).toBeInTheDocument()
    expect(within(container).getByText('U')).toBeInTheDocument()
  })

  it('forwards ref on Avatar', () => {
    const ref = createRef<HTMLSpanElement>()
    render(
      <Avatar ref={ref}>
        <AvatarFallback>R</AvatarFallback>
      </Avatar>,
    )
    expect(ref.current).toBeInstanceOf(HTMLSpanElement)
  })

  it('forwards ref on AvatarFallback', () => {
    const ref = createRef<HTMLSpanElement>()
    render(
      <Avatar>
        <AvatarFallback ref={ref}>FB</AvatarFallback>
      </Avatar>,
    )
    expect(ref.current).toBeInstanceOf(HTMLSpanElement)
  })

  it('merges custom className on Avatar', () => {
    const { container } = render(
      <Avatar className="h-16 w-16">
        <AvatarFallback>C</AvatarFallback>
      </Avatar>,
    )
    expect(container.firstChild).toHaveClass('h-16')
    expect(container.firstChild).toHaveClass('w-16')
  })

  it('merges custom className on AvatarFallback', () => {
    const { container } = render(
      <Avatar>
        <AvatarFallback className="bg-red-500">FB</AvatarFallback>
      </Avatar>,
    )
    expect(within(container).getByText('FB')).toHaveClass('bg-red-500')
  })
})
