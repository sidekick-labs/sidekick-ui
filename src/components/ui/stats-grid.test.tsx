import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup, within } from '@testing-library/react'
import { createRef } from 'react'
import { StatsGrid } from './stats-grid'

afterEach(cleanup)

describe('StatsGrid', () => {
  it('renders children', () => {
    const { container } = render(
      <StatsGrid>
        <div>Card 1</div>
        <div>Card 2</div>
      </StatsGrid>,
    )
    expect(within(container).getByText('Card 1')).toBeInTheDocument()
    expect(within(container).getByText('Card 2')).toBeInTheDocument()
  })

  it('applies grid styles', () => {
    const { container } = render(
      <StatsGrid>
        <div>Card</div>
      </StatsGrid>,
    )
    const grid = container.firstChild as HTMLElement
    expect(grid.className).toContain('grid')
    expect(grid.className).toContain('gap-6')
  })

  it('applies default 220px minColumnWidth in grid-template-columns', () => {
    const { container } = render(
      <StatsGrid>
        <div>Card</div>
      </StatsGrid>,
    )
    const grid = container.firstChild as HTMLElement
    expect(grid.style.gridTemplateColumns).toBe('repeat(auto-fit, minmax(220px, 1fr))')
  })

  it('applies custom minColumnWidth', () => {
    const { container } = render(
      <StatsGrid minColumnWidth={300}>
        <div>Card</div>
      </StatsGrid>,
    )
    const grid = container.firstChild as HTMLElement
    expect(grid.style.gridTemplateColumns).toBe('repeat(auto-fit, minmax(300px, 1fr))')
  })

  it('forwards ref', () => {
    const ref = createRef<HTMLDivElement>()
    render(
      <StatsGrid ref={ref}>
        <div>Card</div>
      </StatsGrid>,
    )
    expect(ref.current).toBeInstanceOf(HTMLDivElement)
  })

  it('merges custom className', () => {
    const { container } = render(
      <StatsGrid className="custom-class">
        <div>Card</div>
      </StatsGrid>,
    )
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('merges custom style with grid-template-columns', () => {
    const { container } = render(
      <StatsGrid style={{ color: 'red' }}>
        <div>Card</div>
      </StatsGrid>,
    )
    const grid = container.firstChild as HTMLElement
    expect(grid.style.color).toBe('red')
    expect(grid.style.gridTemplateColumns).toContain('auto-fit')
  })
})
