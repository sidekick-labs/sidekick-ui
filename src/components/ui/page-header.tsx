import * as React from 'react'
import { ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from './breadcrumb'

export interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  /** Breadcrumb trail rendered as plain anchors. For client-side routing, use `BreadcrumbLink` with `asChild` directly instead of this prop. */
  breadcrumbs?: Array<{ label: string; href?: string }>
  actions?: React.ReactNode
  /** Renders a back button. Requires `onBackClick` to be provided — ignored without it. */
  showBackButton?: boolean
  onBackClick?: () => void
}

const PageHeader = React.forwardRef<HTMLDivElement, PageHeaderProps>(
  (
    { className, title, breadcrumbs, actions, showBackButton, onBackClick, children, ...props },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center justify-between border-b border-[var(--color-border)] px-6 py-4',
          className,
        )}
        {...props}
      >
        <div className="flex items-center gap-4 min-w-0 flex-1">
          {breadcrumbs && breadcrumbs.length > 0 && (
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumbs.map((crumb, index) => (
                  <React.Fragment key={`${crumb.href ?? crumb.label}-${index}`}>
                    {index > 0 && <BreadcrumbSeparator />}
                    <BreadcrumbItem>
                      {index === breadcrumbs.length - 1 ? (
                        <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                  </React.Fragment>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          )}
          {title && <h1 className="text-xl font-semibold text-[var(--color-text)]">{title}</h1>}
          {children}
        </div>

        <div className="flex items-center gap-3">
          {actions}
          {showBackButton && onBackClick && (
            <button
              type="button"
              onClick={onBackClick}
              className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 rounded-[var(--radius-sm)]"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>
          )}
        </div>
      </div>
    )
  },
)
PageHeader.displayName = 'PageHeader'

export { PageHeader }
