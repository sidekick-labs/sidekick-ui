import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  formatDate,
  formatDateTime,
  formatRelativeTime,
  formatDateTimeWithTimezone,
  getLocalTimezone,
} from './format-date'

describe('format-date utilities', () => {
  const testDate = '2024-01-01T12:00:00Z'

  describe('formatDate', () => {
    it('formats a date string correctly', () => {
      const date = '2024-01-15T10:30:00Z'
      const result = formatDate(date)
      expect(result).toMatch(/^\d{4}\.\d{2}\.\d{2}$/)
    })

    it('formats date correctly in UTC (default)', () => {
      expect(formatDate(testDate)).toBe('2024.01.01')
    })

    it('formats date correctly in different timezone', () => {
      expect(formatDate(testDate, 'America/New_York')).toBe('2024.01.01')
      expect(formatDate(testDate, 'Australia/Perth')).toBe('2024.01.01')
    })

    it('adjusts date boundary across timezones', () => {
      const lateDate = '2024-01-01T23:00:00Z'
      expect(formatDate(lateDate, 'America/New_York')).toBe('2024.01.01')
      expect(formatDate(lateDate, 'Australia/Sydney')).toBe('2024.01.02')
    })

    it('handles null input', () => {
      expect(formatDate(null)).toBe('—')
    })

    it('handles invalid date strings gracefully', () => {
      expect(formatDate('invalid-date')).toBe('—')
    })
  })

  describe('formatDateTime', () => {
    it('formats a datetime string correctly', () => {
      const date = '2024-01-15T10:30:00Z'
      const result = formatDateTime(date)
      expect(typeof result).toBe('string')
    })

    it('formats datetime in UTC (default)', () => {
      expect(formatDateTime(testDate)).toBe('2024.01.01 12:00')
    })

    it('formats datetime in specific timezone', () => {
      expect(formatDateTime(testDate, false, 'America/New_York')).toBe('2024.01.01 07:00')
      expect(formatDateTime(testDate, false, 'Europe/Paris')).toBe('2024.01.01 13:00')
    })

    it('includes timezone abbreviation when requested', () => {
      const result = formatDateTime(testDate, true, 'America/New_York')
      expect(result).toBe('2024.01.01 07:00 EST')
    })

    it('handles null input', () => {
      expect(formatDateTime(null)).toBe('—')
    })
  })

  describe('formatDateTimeWithTimezone', () => {
    it('includes timezone abbreviation', () => {
      expect(formatDateTimeWithTimezone(testDate, 'UTC')).toBe('2024.01.01 12:00 UTC')
    })

    it('handles null input', () => {
      expect(formatDateTimeWithTimezone(null)).toBe('—')
    })
  })

  describe('formatRelativeTime', () => {
    const NOW = new Date('2024-06-15T12:00:00Z')

    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(NOW)
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('formats relative time correctly', () => {
      const result = formatRelativeTime(NOW.toISOString())
      expect(result).toBe('0 seconds ago')
    })

    it('handles past dates', () => {
      const date = new Date(NOW.getTime() - 3600000).toISOString()
      expect(formatRelativeTime(date)).toBe('1 hour ago')
    })

    it('handles future dates', () => {
      const date = new Date(NOW.getTime() + 3600000).toISOString()
      expect(formatRelativeTime(date)).toBe('in 1 hour')
    })

    it('handles null input', () => {
      expect(formatRelativeTime(null)).toBe('—')
    })
  })

  describe('getLocalTimezone', () => {
    it('returns a timezone string in a standard environment', () => {
      const tz = getLocalTimezone()
      expect(typeof tz).toBe('string')
      expect(tz!.length).toBeGreaterThan(0)
    })

    it('returns undefined when Intl is not available', () => {
      const originalIntl = globalThis.Intl
      vi.stubGlobal('Intl', undefined)
      expect(getLocalTimezone()).toBeUndefined()
      vi.stubGlobal('Intl', originalIntl)
    })
  })
})
