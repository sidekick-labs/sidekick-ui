import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup, within } from '@testing-library/react'
import { createRef } from 'react'
import { StatCard } from './stat-card'

afterEach(cleanup)

describe('StatCard', () => {
  it('renders label and value', () => {
    const { container } = render(<StatCard label="Users" value={42} />)
    expect(within(container).getByText('Users')).toBeInTheDocument()
    expect(within(container).getByText('42')).toBeInTheDocument()
  })

  it('renders description when provided', () => {
    const { container } = render(
      <StatCard label="Users" value={42} description="Total active users" />,
    )
    expect(within(container).getByText('Total active users')).toBeInTheDocument()
  })

  it('does not render description when not provided', () => {
    const { container } = render(<StatCard label="Users" value={42} />)
    expect(container.textContent).not.toContain('Total active users')
  })

  it('renders icon when provided', () => {
    const TestIcon = () => <svg data-testid="test-icon" />
    const { getByTestId } = render(<StatCard label="Users" value={42} icon={TestIcon} />)
    expect(getByTestId('test-icon')).toBeInTheDocument()
  })

  it('renders trend with up direction', () => {
    const { container } = render(
      <StatCard label="Revenue" value="$1k" trend={{ value: '+12%', direction: 'up' }} />,
    )
    const trendEl = within(container).getByText(/\+12%/)
    expect(trendEl.className).toContain('text-[var(--color-success)]')
  })

  it('renders trend with down direction', () => {
    const { container } = render(
      <StatCard label="Errors" value={5} trend={{ value: '-3%', direction: 'down' }} />,
    )
    const trendEl = within(container).getByText(/-3%/)
    expect(trendEl.className).toContain('text-[var(--color-danger)]')
  })

  it('renders trend with neutral direction', () => {
    const { container } = render(
      <StatCard label="Status" value="OK" trend={{ value: '0%', direction: 'neutral' }} />,
    )
    const trendEl = within(container).getByText(/0%/)
    expect(trendEl.className).toContain('text-[var(--color-text-muted)]')
  })

  it('hides trend arrow from screen readers', () => {
    const { container } = render(
      <StatCard label="Revenue" value="$1k" trend={{ value: '+12%', direction: 'up' }} />,
    )
    const arrowSpan = container.querySelector('[aria-hidden="true"]')
    expect(arrowSpan).toBeInTheDocument()
    expect(arrowSpan!.textContent).toBe('↑')
  })

  it('provides screen reader context for trend', () => {
    const { container } = render(
      <StatCard label="Revenue" value="$1k" trend={{ value: '+12%', direction: 'up' }} />,
    )
    const srOnly = container.querySelector('.sr-only')
    expect(srOnly).toBeInTheDocument()
    expect(srOnly!.textContent).toBe('Trend up: ')
  })

  it('renders icon with size constraints', () => {
    const TestIcon = ({ className }: { className?: string }) => (
      <svg data-testid="sized-icon" className={className} />
    )
    const { getByTestId } = render(<StatCard label="Test" value={0} icon={TestIcon} />)
    expect(getByTestId('sized-icon').getAttribute('class')).toContain('w-5')
    expect(getByTestId('sized-icon').getAttribute('class')).toContain('h-5')
  })

  it('forwards ref', () => {
    const ref = createRef<HTMLDivElement>()
    render(<StatCard ref={ref} label="Test" value={0} />)
    expect(ref.current).toBeInstanceOf(HTMLDivElement)
  })

  it('merges custom className', () => {
    const { container } = render(<StatCard className="custom-class" label="Test" value={0} />)
    expect(container.firstChild).toHaveClass('custom-class')
  })
})
