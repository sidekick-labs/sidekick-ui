import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { createRef } from 'react'
import { ProgressBar } from './progress-bar'

afterEach(cleanup)

describe('ProgressBar', () => {
  it('renders with correct aria attributes', () => {
    const { container } = render(<ProgressBar value={50} />)
    const bar = container.firstChild as HTMLElement
    expect(bar.getAttribute('role')).toBe('progressbar')
    expect(bar.getAttribute('aria-valuenow')).toBe('50')
    expect(bar.getAttribute('aria-valuemin')).toBe('0')
    expect(bar.getAttribute('aria-valuemax')).toBe('100')
  })

  it('renders with custom max', () => {
    const { container } = render(<ProgressBar value={25} max={50} />)
    const bar = container.firstChild as HTMLElement
    expect(bar.getAttribute('aria-valuemax')).toBe('50')
  })

  it('renders default primary variant', () => {
    const { container } = render(<ProgressBar value={50} />)
    const inner = (container.firstChild as HTMLElement).firstChild as HTMLElement
    expect(inner.className).toContain('bg-[var(--color-primary)]')
  })

  it('renders each variant', () => {
    const variants = ['primary', 'success', 'warning', 'danger'] as const
    for (const variant of variants) {
      const { container } = render(<ProgressBar value={50} variant={variant} />)
      const inner = (container.firstChild as HTMLElement).firstChild as HTMLElement
      expect(inner.className).toContain(`bg-[var(--color-${variant})]`)
      cleanup()
    }
  })

  it('renders sm size', () => {
    const { container } = render(<ProgressBar value={50} size="sm" />)
    expect((container.firstChild as HTMLElement).className).toContain('h-1.5')
  })

  it('renders md size by default', () => {
    const { container } = render(<ProgressBar value={50} />)
    expect((container.firstChild as HTMLElement).className).toContain('h-2')
  })

  it('renders lg size', () => {
    const { container } = render(<ProgressBar value={50} size="lg" />)
    expect((container.firstChild as HTMLElement).className).toContain('h-3')
  })

  it('clamps percentage to 0-100', () => {
    const { container: c1 } = render(<ProgressBar value={150} />)
    const inner1 = (c1.firstChild as HTMLElement).firstChild as HTMLElement
    expect(inner1.style.width).toBe('100%')

    cleanup()

    const { container: c2 } = render(<ProgressBar value={-10} />)
    const inner2 = (c2.firstChild as HTMLElement).firstChild as HTMLElement
    expect(inner2.style.width).toBe('0%')
  })

  it('clamps aria-valuenow when value exceeds max', () => {
    const { container } = render(<ProgressBar value={150} max={100} />)
    const bar = container.firstChild as HTMLElement
    expect(bar.getAttribute('aria-valuenow')).toBe('100')
  })

  it('clamps aria-valuenow when value is negative', () => {
    const { container } = render(<ProgressBar value={-10} max={100} />)
    const bar = container.firstChild as HTMLElement
    expect(bar.getAttribute('aria-valuenow')).toBe('0')
  })

  it('forwards ref', () => {
    const ref = createRef<HTMLDivElement>()
    render(<ProgressBar ref={ref} value={50} />)
    expect(ref.current).toBeInstanceOf(HTMLDivElement)
  })

  it('merges custom className', () => {
    const { container } = render(<ProgressBar className="custom-class" value={50} />)
    expect(container.firstChild).toHaveClass('custom-class')
  })
})
