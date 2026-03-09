import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, fireEvent, cleanup } from '@testing-library/react'
import { createRef } from 'react'
import { Checkbox } from './checkbox'

afterEach(cleanup)

describe('Checkbox', () => {
  it('renders unchecked by default', () => {
    const { container } = render(<Checkbox />)
    const button = container.querySelector('button')
    expect(button).toBeInTheDocument()
    expect(button).toHaveAttribute('data-state', 'unchecked')
  })

  it('renders checked when defaultChecked', () => {
    const { container } = render(<Checkbox defaultChecked />)
    const button = container.querySelector('button')
    expect(button).toHaveAttribute('data-state', 'checked')
  })

  it('renders checked when checked prop is true', () => {
    const { container } = render(<Checkbox checked onCheckedChange={() => {}} />)
    const button = container.querySelector('button')
    expect(button).toHaveAttribute('data-state', 'checked')
  })

  it('calls onCheckedChange when clicked', () => {
    const onCheckedChange = vi.fn()
    const { container } = render(<Checkbox onCheckedChange={onCheckedChange} />)
    fireEvent.click(container.querySelector('button')!)
    expect(onCheckedChange).toHaveBeenCalledTimes(1)
    expect(onCheckedChange).toHaveBeenCalledWith(true)
  })

  it('is disabled when disabled prop is set', () => {
    const { container } = render(<Checkbox disabled />)
    expect(container.querySelector('button')).toBeDisabled()
  })

  it('does not call onCheckedChange when disabled', () => {
    const onCheckedChange = vi.fn()
    const { container } = render(<Checkbox disabled onCheckedChange={onCheckedChange} />)
    fireEvent.click(container.querySelector('button')!)
    expect(onCheckedChange).not.toHaveBeenCalled()
  })

  it('forwards ref', () => {
    const ref = createRef<HTMLButtonElement>()
    render(<Checkbox ref={ref} />)
    expect(ref.current).toBeInstanceOf(HTMLButtonElement)
  })

  it('merges custom className', () => {
    const { container } = render(<Checkbox className="custom-class" />)
    expect(container.querySelector('button')).toHaveClass('custom-class')
  })

  it('has correct role', () => {
    const { container } = render(<Checkbox />)
    expect(container.querySelector('[role="checkbox"]')).toBeInTheDocument()
  })
})
