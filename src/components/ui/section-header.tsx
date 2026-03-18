import * as React from 'react'
import { cn } from '@/lib/utils'

export interface SectionHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Content rendered on the right side of the header */
  actions?: React.ReactNode
  /** Additional className for the heading text */
  headingClassName?: string
}

const SectionHeader = React.forwardRef<HTMLDivElement, SectionHeaderProps>(
  ({ className, actions, headingClassName, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex items-center justify-between mt-8 mb-6', className)}
        {...props}
      >
        <h3
          className={cn(
            'text-[var(--color-text-muted)] text-xs uppercase tracking-wider font-medium',
            headingClassName,
          )}
        >
          {children}
        </h3>
        {actions && <div>{actions}</div>}
      </div>
    )
  },
)
SectionHeader.displayName = 'SectionHeader'

export { SectionHeader }
