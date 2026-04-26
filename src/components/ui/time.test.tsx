import * as React from 'react'
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { render, renderHook, cleanup, within } from '@testing-library/react'
import { Time, TimezoneProvider, useTimezone } from './time'

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

  it('renders datetime format without a provider (browser-tz fallback)', () => {
    const { container } = render(<Time date={testDate} format="datetime" />)
    const time = container.querySelector('time')
    expect(time?.tagName).toBe('TIME')
    expect(time?.textContent).toMatch(/^\d{4}\.\d{2}\.\d{2} \d{2}:\d{2}$/)
  })

  it('renders em-dash for unparseable date strings', () => {
    const { container } = render(<Time date="not-a-date" className="muted" />)
    expect(container.querySelector('time')).toBeNull()
    const span = container.querySelector('span')
    expect(span?.textContent).toBe('—')
    expect(span?.className).toBe('muted')
  })

  it('inner TimezoneProvider with undefined value does not shadow outer provider', () => {
    const { container } = render(
      <TimezoneProvider value="America/New_York">
        <TimezoneProvider value={undefined}>
          <Time date={testDate} format="datetime" />
        </TimezoneProvider>
      </TimezoneProvider>,
    )
    const time = container.querySelector('time')
    expect(time?.textContent).toBe('2024.01.01 07:00')
    expect(time?.getAttribute('title')).toBe('America/New_York')
  })
})

describe('useTimezone', () => {
  it('returns context timezone when wrapped in TimezoneProvider', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TimezoneProvider value="America/New_York">{children}</TimezoneProvider>
    )
    const { result } = renderHook(() => useTimezone(), { wrapper })
    expect(result.current).toBe('America/New_York')
  })

  it('falls back to a non-empty timezone when no provider is present', () => {
    const { result } = renderHook(() => useTimezone())
    expect(typeof result.current).toBe('string')
    expect(result.current.length).toBeGreaterThan(0)
  })
})
