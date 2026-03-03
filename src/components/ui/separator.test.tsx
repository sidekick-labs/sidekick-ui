import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { Separator } from './separator'

afterEach(cleanup)

describe('Separator', () => {
  it('renders horizontal by default', () => {
    const { container } = render(<Separator />)
    const el = container.firstChild as HTMLElement
    expect(el.className).toContain('w-full')
    expect(el.className).toContain('bg-[var(--color-border)]')
  })

  it('renders vertical orientation', () => {
    const { container } = render(<Separator orientation="vertical" />)
    const el = container.firstChild as HTMLElement
    expect(el.className).toContain('h-full')
  })

  it('renders dashed horizontal', () => {
    const { container } = render(<Separator dashed />)
    const el = container.firstChild as HTMLElement
    expect(el.className).toContain('border-dashed')
    expect(el.className).toContain('bg-transparent')
    expect(el.className).toContain('border-t')
  })

  it('renders dashed vertical', () => {
    const { container } = render(<Separator orientation="vertical" dashed />)
    const el = container.firstChild as HTMLElement
    expect(el.className).toContain('border-dashed')
    expect(el.className).toContain('border-l')
  })

  it('merges custom className', () => {
    const { container } = render(<Separator className="custom-class" />)
    expect(container.firstChild).toHaveClass('custom-class')
  })
})
