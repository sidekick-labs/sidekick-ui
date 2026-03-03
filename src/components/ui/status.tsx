import * as React from 'react'
import { cn } from '@/lib/utils'

export interface StatusProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'active' | 'online' | 'offline' | 'completed' | 'failed' | 'cancelled' | 'processing'
}

const Status = React.forwardRef<HTMLSpanElement, StatusProps>(
  ({ className, variant = 'active', children, ...props }, ref) => {
    // active and completed both map to success — intentionally identical as positive states
    const variants = {
      active: 'text-[var(--color-success)]',
      online: 'text-[var(--color-info)]',
      offline: 'text-[var(--color-text-muted)]',
      completed: 'text-[var(--color-success)]',
      failed: 'text-[var(--color-danger)]',
      cancelled: 'text-[var(--color-text-muted)]',
      processing: 'text-[var(--color-warning)]',
    }

    return (
      <span
        ref={ref}
        className={cn('text-xs font-medium uppercase tracking-wide', variants[variant], className)}
        {...props}
      >
        {children}
      </span>
    )
  },
)
Status.displayName = 'Status'

export { Status }
