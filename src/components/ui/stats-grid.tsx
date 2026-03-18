import * as React from 'react'
import { cn } from '@/lib/utils'

export interface StatsGridProps extends React.HTMLAttributes<HTMLDivElement> {
  columns?: number
}

const StatsGrid = React.forwardRef<HTMLDivElement, StatsGridProps>(
  ({ className, columns: _columns = 3, style, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('grid gap-6', className)}
        style={{
          gridTemplateColumns: `repeat(auto-fit, minmax(220px, 1fr))`,
          ...style,
        }}
        {...props}
      />
    )
  },
)
StatsGrid.displayName = 'StatsGrid'

export { StatsGrid }
