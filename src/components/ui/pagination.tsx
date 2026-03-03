import * as React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './button'
import { PaginationMetadata } from '@/types/pagination'

export interface PaginationProps extends React.HTMLAttributes<HTMLDivElement> {
  pagination: PaginationMetadata
  onPageChange: (page: number) => void
  variant?: 'compact' | 'full'
}

const Pagination = React.forwardRef<HTMLDivElement, PaginationProps>(
  ({ pagination, onPageChange, variant = 'full', className, ...props }, ref) => {
    if (pagination.pages <= 1) {
      return null
    }

    if (variant === 'compact') {
      return (
        <div
          ref={ref}
          className={cn(
            'flex items-center justify-between px-5 py-3 border-t border-[var(--color-border)] bg-[var(--color-surface)]',
            className,
          )}
          {...props}
        >
          <span className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">
            Page {pagination.page} of {pagination.pages}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={!pagination.previous}
              onClick={() => onPageChange(pagination.previous!)}
              className="text-[10px] uppercase tracking-wider"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Prev
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={!pagination.next}
              onClick={() => onPageChange(pagination.next!)}
              className="text-[10px] uppercase tracking-wider"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )
    }

    return (
      <div
        ref={ref}
        className={cn(
          'px-5 py-4 border-t border-[var(--color-border)] bg-[var(--color-surface)]',
          className,
        )}
        {...props}
      >
        <div className="flex items-center justify-between">
          <div className="text-sm text-[var(--color-text-muted)]">
            Showing <span className="font-medium text-[var(--color-text)]">{pagination.from}</span>{' '}
            to <span className="font-medium text-[var(--color-text)]">{pagination.to}</span> of{' '}
            <span className="font-medium text-[var(--color-text)]">{pagination.count}</span> results
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onPageChange(pagination.previous!)}
              disabled={!pagination.previous}
            >
              Previous
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onPageChange(pagination.next!)}
              disabled={!pagination.next}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    )
  },
)
Pagination.displayName = 'Pagination'

export { Pagination }
