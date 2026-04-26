import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { render, cleanup, within } from '@testing-library/react'
import { Time, TimezoneProvider } from './time'

afterEach(cleanup)

describe('Time', () => {
  const testDate = '2024-01-01T12:00:00Z'

  it('renders em-dash when date is null', () => {
    const { container } = render(<Time date={null} className="muted" />)
    const span = container.querySelector('span')
    expect(span).not.toBeNull()
    expect(span?.textContent).toBe('—')
    expect(span?.className).toBe('muted')
  })

  it('renders date format by default', () => {
    const { container } = render(<Time date={testDate} timezone="UTC" />)
    const time = container.querySelector('time')
    expect(time).not.toBeNull()
    expect(time?.textContent).toBe('2024.01.01')
  })

  it('reads timezone from TimezoneProvider', () => {
    const { container } = render(
      <TimezoneProvider value="America/New_York">
        <Time date={testDate} format="datetime" />
      </TimezoneProvider>,
    )
    const time = container.querySelector('time')
    expect(time?.textContent).toBe('2024.01.01 07:00')
    expect(time?.getAttribute('title')).toBe('America/New_York')
  })

  it('explicit timezone prop overrides provider', () => {
    const { container } = render(
      <TimezoneProvider value="America/New_York">
        <Time date={testDate} format="datetime" timezone="Europe/Paris" />
      </TimezoneProvider>,
    )
    const time = container.querySelector('time')
    expect(time?.textContent).toBe('2024.01.01 13:00')
    expect(time?.getAttribute('title')).toBe('Europe/Paris')
  })

  describe('format="relative"', () => {
    const NOW = new Date('2024-06-15T12:00:00Z')

    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(NOW)
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('produces relative-time output', () => {
      const past = new Date(NOW.getTime() - 3600000).toISOString()
      const { container } = render(<Time date={past} format="relative" />)
      const time = within(container).getByText('1 hour ago')
      expect(time.tagName).toBe('TIME')
    })
  })

  it('sets dateTime and title attributes correctly', () => {
    const { container } = render(
      <Time date={testDate} format="datetime-tz" timezone="UTC" className="text-sm" />,
    )
    const time = container.querySelector('time')
    expect(time?.getAttribute('datetime')).toBe(testDate)
    expect(time?.getAttribute('title')).toBe('UTC')
    expect(time?.className).toBe('text-sm')
    expect(time?.textContent).toBe('2024.01.01 12:00 UTC')
  })
})
