import * as React from 'react'
import { cn } from '@/lib/utils'

export interface SectionHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Content rendered on the right side of the header */
  actions?: React.ReactNode
  /** Additional className for the heading text */
  headingClassName?: string
  /** Heading level (default: 'h3'). Set to match your page's heading hierarchy. */
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
}

const SectionHeader = React.forwardRef<HTMLDivElement, SectionHeaderProps>(
  ({ className, actions, headingClassName, as: Heading = 'h3', children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('flex items-center justify-between mb-4', className)} {...props}>
        <Heading
          className={cn(
            'text-[var(--color-text-muted)] text-xs uppercase tracking-wider font-medium',
            headingClassName,
          )}
        >
          {children}
        </Heading>
        {actions && <div>{actions}</div>}
      </div>
    )
  },
)
SectionHeader.displayName = 'SectionHeader'

export { SectionHeader }
