import * as React from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent } from './card'

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string
  value: React.ReactNode
  description?: string
  icon?: React.ElementType<{ className?: string }>
  trend?: { value: string; direction: 'up' | 'down' | 'neutral' }
}

const trendColors = {
  up: 'text-[var(--color-success)]',
  down: 'text-[var(--color-danger)]',
  neutral: 'text-[var(--color-text-muted)]',
}

const trendArrows = {
  up: '\u2191',
  down: '\u2193',
  neutral: '\u2192',
}

const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  ({ className, label, value, description, icon: Icon, trend, ...props }, ref) => {
    return (
      <Card ref={ref} className={cn(className)} {...props}>
        <CardContent padding="md">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="text-[11px] uppercase tracking-wider text-[var(--color-text-muted)]">
                {label}
              </div>
              <div className="text-2xl font-bold">{value}</div>
              {description && (
                <div className="text-xs text-[var(--color-text-muted)] mt-1">{description}</div>
              )}
              {trend && (
                <div className={cn('text-xs mt-1 font-medium', trendColors[trend.direction])}>
                  <span aria-hidden="true">{trendArrows[trend.direction]}</span>
                  <span className="sr-only">Trend: </span>
                  {trend.value}
                </div>
              )}
            </div>
            {Icon && (
              <div className="text-[var(--color-text-muted)]">
                <Icon className="w-5 h-5" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  },
)
StatCard.displayName = 'StatCard'

export { StatCard }
