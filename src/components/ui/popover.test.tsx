import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup, screen } from '@testing-library/react'
import { Popover, PopoverTrigger, PopoverContent } from './popover'

afterEach(cleanup)

// Radix Popover uses portals. Use `open` prop to control visibility in tests.

describe('Popover', () => {
  it('renders trigger', () => {
    render(
      <Popover>
        <PopoverTrigger>Open Popover</PopoverTrigger>
        <PopoverContent>Popover body</PopoverContent>
      </Popover>,
    )
    expect(screen.getByText('Open Popover')).toBeInTheDocument()
  })

  it('shows content when open', () => {
    render(
      <Popover open>
        <PopoverTrigger>Trigger</PopoverTrigger>
        <PopoverContent>Popover content here</PopoverContent>
      </Popover>,
    )
    expect(screen.getByText('Popover content here')).toBeInTheDocument()
  })

  it('does not show content when closed', () => {
    render(
      <Popover open={false}>
        <PopoverTrigger>Trigger</PopoverTrigger>
        <PopoverContent>Hidden content</PopoverContent>
      </Popover>,
    )
    expect(screen.queryByText('Hidden content')).not.toBeInTheDocument()
  })

  it('renders complex content inside popover', () => {
    render(
      <Popover open>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent>
          <h3>Settings</h3>
          <p>Configure your preferences</p>
        </PopoverContent>
      </Popover>,
    )
    expect(screen.getByText('Settings')).toBeInTheDocument()
    expect(screen.getByText('Configure your preferences')).toBeInTheDocument()
  })
})
