import * as React from 'react'
import { cn } from '@/lib/utils'

export interface StatsGridProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Minimum width of each column in pixels (default: 220). Used with auto-fit to create responsive grids. */
  minColumnWidth?: number
}

const StatsGrid = React.forwardRef<HTMLDivElement, StatsGridProps>(
  ({ className, minColumnWidth = 220, style, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('grid gap-6', className)}
        style={{
          gridTemplateColumns: `repeat(auto-fit, minmax(${minColumnWidth}px, 1fr))`,
          ...style,
        }}
        {...props}
      />
    )
  },
)
StatsGrid.displayName = 'StatsGrid'

export { StatsGrid }
