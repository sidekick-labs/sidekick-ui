import * as React from 'react'
import { cn } from '@/lib/utils'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'info' | 'success' | 'warning' | 'danger' | 'muted'
  size?: 'sm' | 'md'
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const variants = {
      primary: 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]',
      secondary: 'bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)]',
      accent: 'bg-[var(--color-accent)] text-[var(--color-accent-foreground)]',
      info: 'bg-[var(--color-info)] text-[var(--color-info-foreground)]',
      success: 'bg-[var(--color-success)] text-[var(--color-success-foreground)]',
      warning: 'bg-[var(--color-warning)] text-[var(--color-warning-foreground)]',
      danger: 'bg-[var(--color-danger)] text-[var(--color-danger-foreground)]',
      muted: 'bg-[var(--color-muted)] text-[var(--color-muted-foreground)]',
    }

    const sizes = {
      sm: 'px-1.5 py-0.5 text-[10px]',
      md: 'px-2 py-0.5 text-xs',
    }

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-[var(--radius-sm)] font-medium uppercase',
          variants[variant],
          sizes[size],
          className,
        )}
        {...props}
      />
    )
  },
)
Badge.displayName = 'Badge'

export { Badge }
