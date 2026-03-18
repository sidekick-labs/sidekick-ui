import * as React from 'react'
import { cn } from '@/lib/utils'

export interface SectionHeaderProps extends React.HTMLAttributes<HTMLHeadingElement> {
  actions?: React.ReactNode
}

const SectionHeader = React.forwardRef<HTMLHeadingElement, SectionHeaderProps>(
  ({ className, actions, children, ...props }, ref) => {
    return (
      <div className="flex items-center justify-between mt-8 mb-6">
        <h3
          ref={ref}
          className={cn(
            'text-[var(--color-text-muted)] text-xs uppercase tracking-wider font-medium',
            className,
          )}
          {...props}
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
