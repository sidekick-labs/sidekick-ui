import * as React from 'react'
import { cn } from '@/lib/utils'

export type DataTableProps = React.TableHTMLAttributes<HTMLTableElement>

const DataTable = React.forwardRef<HTMLTableElement, DataTableProps>(
  ({ className, ...props }, ref) => {
    return (
      <table ref={ref} className={cn('w-full border-collapse text-[13px]', className)} {...props} />
    )
  },
)
DataTable.displayName = 'DataTable'

export type TableHeaderProps = React.HTMLAttributes<HTMLTableSectionElement>

const TableHeader = React.forwardRef<HTMLTableSectionElement, TableHeaderProps>(
  ({ className, ...props }, ref) => {
    return <thead ref={ref} className={className} {...props} />
  },
)
TableHeader.displayName = 'TableHeader'

export type TableBodyProps = React.HTMLAttributes<HTMLTableSectionElement>

const TableBody = React.forwardRef<HTMLTableSectionElement, TableBodyProps>(
  ({ className, ...props }, ref) => {
    return <tbody ref={ref} className={className} {...props} />
  },
)
TableBody.displayName = 'TableBody'

export interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  hoverable?: boolean
}

const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ className, hoverable, ...props }, ref) => {
    return (
      <tr
        ref={ref}
        className={cn(
          hoverable && 'hover:bg-[var(--color-surface-hover)] transition-colors',
          className,
        )}
        {...props}
      />
    )
  },
)
TableRow.displayName = 'TableRow'

export type TableHeadProps = React.ThHTMLAttributes<HTMLTableCellElement>

const TableHead = React.forwardRef<HTMLTableCellElement, TableHeadProps>(
  ({ className, scope = 'col', ...props }, ref) => {
    return (
      <th
        ref={ref}
        scope={scope}
        className={cn(
          'text-left px-4 py-2.5 bg-[var(--color-background)] border-b border-[var(--color-border)] text-[var(--color-text-muted)] text-[11px] uppercase tracking-wide font-medium whitespace-nowrap',
          className,
        )}
        {...props}
      />
    )
  },
)
TableHead.displayName = 'TableHead'

export type TableCellProps = React.TdHTMLAttributes<HTMLTableCellElement>

const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ className, ...props }, ref) => {
    return (
      <td
        ref={ref}
        className={cn(
          'px-4 py-2.5 border-b border-[var(--color-border)]/30 text-[var(--color-text-secondary)] align-middle',
          className,
        )}
        {...props}
      />
    )
  },
)
TableCell.displayName = 'TableCell'

export { DataTable, TableHeader, TableBody, TableRow, TableHead, TableCell }
