import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, fireEvent, cleanup, within } from '@testing-library/react'
import { createRef } from 'react'
import { Button } from './button'

afterEach(cleanup)

describe('Button', () => {
  it('renders with default variant and size', () => {
    const { container } = render(<Button>Click me</Button>)
    const button = within(container).getByRole('button')
    expect(button).toHaveTextContent('Click me')
    expect(button.className).toContain('bg-[var(--color-primary)]')
    expect(button.className).toContain('h-10')
  })

  it('defaults to type="button" to prevent accidental form submission', () => {
    const { container } = render(<Button>Click me</Button>)
    expect(within(container).getByRole('button')).toHaveAttribute('type', 'button')
  })

  it('allows type override to submit', () => {
    const { container } = render(<Button type="submit">Submit</Button>)
    expect(within(container).getByRole('button')).toHaveAttribute('type', 'submit')
  })

  it('renders each variant', () => {
    const variants = [
      'primary',
      'secondary',
      'accent',
      'info',
      'success',
      'danger',
      'ghost',
      'muted',
      'outline',
      'link',
    ] as const

    for (const variant of variants) {
      const { container } = render(<Button variant={variant}>{variant}</Button>)
      const button = within(container).getByRole('button')
      expect(button).toHaveTextContent(variant)
      cleanup()
    }
  })

  it('renders each size', () => {
    const sizes = { sm: 'h-8', md: 'h-10', lg: 'h-12', auto: '' } as const

    for (const [size, expected] of Object.entries(sizes)) {
      const { container } = render(<Button size={size as keyof typeof sizes}>{size}</Button>)
      const button = within(container).getByRole('button')
      if (expected) {
        expect(button.className).toContain(expected)
      }
      cleanup()
    }
  })

  it('forwards ref', () => {
    const ref = createRef<HTMLButtonElement>()
    render(<Button ref={ref}>Ref</Button>)
    expect(ref.current).toBeInstanceOf(HTMLButtonElement)
  })

  it('handles click events', () => {
    const onClick = vi.fn()
    const { container } = render(<Button onClick={onClick}>Click</Button>)
    fireEvent.click(within(container).getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('is disabled when disabled prop is set', () => {
    const { container } = render(<Button disabled>Disabled</Button>)
    expect(within(container).getByRole('button')).toBeDisabled()
  })

  it('renders as child element when asChild is true', () => {
    const { container } = render(
      <Button asChild>
        <a href="/test">Link button</a>
      </Button>,
    )
    const link = container.querySelector('a')
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/test')
    expect(link).toHaveTextContent('Link button')
    // Should not render a <button> element
    expect(container.querySelector('button')).toBeNull()
  })

  it('merges custom className', () => {
    const { container } = render(<Button className="custom-class">Custom</Button>)
    expect(within(container).getByRole('button')).toHaveClass('custom-class')
  })
})
