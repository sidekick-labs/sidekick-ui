/* eslint-disable react-refresh/only-export-components */
import * as React from 'react'
import {
  formatDate,
  formatDateTime,
  formatDateTimeWithTimezone,
  formatRelativeTime,
  getLocalTimezone,
} from '@/lib/format-date'

const DEFAULT_TIMEZONE = 'UTC'

const TimezoneContext = React.createContext<string | undefined>(undefined)

export interface TimezoneProviderProps {
  value: string | undefined
  children: React.ReactNode
}

/** Provides a tree-wide timezone for `<Time>` and `useTimezone()`. */
export function TimezoneProvider({ value, children }: TimezoneProviderProps) {
  return <TimezoneContext value={value}>{children}</TimezoneContext>
}

/** Returns the resolved timezone (context → local → UTC). */
export function useTimezone(): string {
  const ctx = React.use(TimezoneContext)
  return ctx || getLocalTimezone() || DEFAULT_TIMEZONE
}

export interface TimeProps {
  date: string | null
  format?: 'date' | 'datetime' | 'datetime-tz' | 'relative'
  className?: string
  timezone?: string
}

/** Renders a `<time>` element with localized formatting; falls back to `—` when date is null. */
export function Time({ date, format = 'date', className, timezone }: TimeProps) {
  const ctxTimezone = React.use(TimezoneContext)
  const resolvedTimezone = timezone || ctxTimezone || getLocalTimezone() || DEFAULT_TIMEZONE

  if (!date) return <span className={className}>—</span>

  let displayText: string
  switch (format) {
    case 'datetime':
      displayText = formatDateTime(date, false, resolvedTimezone)
      break
    case 'datetime-tz':
      displayText = formatDateTimeWithTimezone(date, resolvedTimezone)
      break
    case 'relative':
      displayText = formatRelativeTime(date)
      break
    default:
      displayText = formatDate(date, resolvedTimezone)
  }

  return (
    <time dateTime={date} className={className} title={resolvedTimezone}>
      {displayText}
    </time>
  )
}
