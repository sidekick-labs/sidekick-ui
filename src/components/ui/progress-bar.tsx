import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * Inline progress indicator with color variants and sizes.
 *
 * For accessibility, pass `aria-label` or `aria-labelledby` so screen readers
 * announce meaningful context (e.g. "Upload progress, 60%") instead of just the percentage.
 *
 * @example <ProgressBar value={60} aria-label="Upload progress" />
 */
export interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number
  max?: number
  variant?: 'primary' | 'success' | 'warning' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

const variantStyles = {
  primary: 'bg-[var(--color-primary)]',
  success: 'bg-[var(--color-success)]',
  warning: 'bg-[var(--color-warning)]',
  danger: 'bg-[var(--color-danger)]',
}

const sizeStyles = {
  sm: 'h-1.5',
  md: 'h-2',
  lg: 'h-3',
}

const ProgressBar = React.forwardRef<HTMLDivElement, ProgressBarProps>(
  ({ className, value, max = 100, variant = 'primary', size = 'md', ...props }, ref) => {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100))

    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        className={cn(
          'bg-[var(--color-muted)] rounded-full overflow-hidden',
          sizeStyles[size],
          className,
        )}
        {...props}
      >
        <div
          className={cn('h-full transition-all', variantStyles[variant])}
          style={{ width: `${percentage}%` }}
        />
      </div>
    )
  },
)
ProgressBar.displayName = 'ProgressBar'

export { ProgressBar }
