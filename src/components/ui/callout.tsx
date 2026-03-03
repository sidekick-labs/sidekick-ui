import * as React from 'react'
import { Lightbulb, AlertTriangle, CheckCircle, XCircle, PenTool } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface CalloutProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'warning' | 'success' | 'danger' | 'note'
  title?: string
}

// Icon elements are instantiated once at module scope for performance. This means
// icon size/color can't be dynamically controlled per-render. If that's ever needed,
// change values to React.ComponentType references (like EmptyState's icon prop).
const variantConfigs = {
  info: {
    container: 'border-[var(--color-info)] bg-[var(--color-info)]/10',
    icon: <Lightbulb className="w-5 h-5 text-[var(--color-info)]" />,
    titleColor: 'text-[var(--color-info)]',
  },
  warning: {
    container: 'border-[var(--color-warning)] bg-[var(--color-warning)]/10',
    icon: <AlertTriangle className="w-5 h-5 text-[var(--color-warning)]" />,
    titleColor: 'text-[var(--color-warning)]',
  },
  success: {
    container: 'border-[var(--color-success)] bg-[var(--color-success)]/10',
    icon: <CheckCircle className="w-5 h-5 text-[var(--color-success)]" />,
    titleColor: 'text-[var(--color-success)]',
  },
  danger: {
    container: 'border-[var(--color-danger)] bg-[var(--color-danger)]/10',
    icon: <XCircle className="w-5 h-5 text-[var(--color-danger)]" />,
    titleColor: 'text-[var(--color-danger)]',
  },
  note: {
    container: 'border-[var(--color-primary)] bg-[var(--color-primary)]/10',
    icon: <PenTool className="w-5 h-5 text-[var(--color-primary)]" />,
    titleColor: 'text-[var(--color-primary)]',
  },
}

const Callout = React.forwardRef<HTMLDivElement, CalloutProps>(
  ({ className, variant = 'note', title, children, ...props }, ref) => {
    const variantConfig = variantConfigs[variant]

    return (
      <div
        ref={ref}
        className={cn(
          'border-l-4 rounded-r-[var(--radius-md)] p-4',
          variantConfig.container,
          className,
        )}
        {...props}
      >
        <div className="flex gap-3">
          <div className="shrink-0 mt-0.5">{variantConfig.icon}</div>
          <div className="flex-1">
            {title && <h4 className={cn('font-medium mb-1', variantConfig.titleColor)}>{title}</h4>}
            <div className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
              {children}
            </div>
          </div>
        </div>
      </div>
    )
  },
)
Callout.displayName = 'Callout'

export { Callout }
