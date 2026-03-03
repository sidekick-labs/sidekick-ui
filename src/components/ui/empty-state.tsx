import * as React from 'react'
import { cn } from '@/lib/utils'

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon: React.ComponentType<{ className?: string }>
  heading: string
  description?: React.ReactNode
  action?: React.ReactNode
}

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ icon: Icon, heading, description, action, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'text-center py-16 px-6 border border-dashed border-[var(--color-border)] rounded-lg',
          className,
        )}
        {...props}
      >
        <Icon className="w-12 h-12 text-[var(--color-text-muted)]/30 mx-auto mb-4" />
        <h3 className="text-base font-medium text-[var(--color-text)] mb-2">{heading}</h3>
        {description && (
          <div className="text-sm text-[var(--color-text-muted)] max-w-sm mx-auto">
            {description}
          </div>
        )}
        {action && <div className="mt-4">{action}</div>}
      </div>
    )
  },
)
EmptyState.displayName = 'EmptyState'

export { EmptyState }
