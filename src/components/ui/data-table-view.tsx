import * as React from 'react'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type OnChangeFn,
  type Row,
  type RowData,
  type SortingState,
  type Table as TanStackTable,
} from '@tanstack/react-table'
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DataTable, TableBody, TableCell, TableHead, TableHeader, TableRow } from './data-table'

export interface DataTableViewProps<TData extends RowData> {
  /** TanStack column definitions. Build these with `createColumnHelper<TData>()`. */
  columns: ColumnDef<TData, unknown>[]
  /** Row data. */
  data: TData[]
  /** Enable client-side sorting (per-column opt-out via each column's `enableSorting`). Default `true`. */
  enableSorting?: boolean
  /** Controlled sorting state. Omit for uncontrolled behaviour. */
  sorting?: SortingState
  /** Sorting change handler (required when `sorting` is controlled). */
  onSortingChange?: OnChangeFn<SortingState>
  /** Initial sorting for the uncontrolled case. */
  initialSorting?: SortingState
  /** Enable client-side global (free-text) filtering. Default `false`. */
  enableGlobalFilter?: boolean
  /** Controlled global filter value. */
  globalFilter?: string
  /** Global filter change handler (required when `globalFilter` is controlled). */
  onGlobalFilterChange?: OnChangeFn<string>
  /** Apply hover styling to body rows. Default `true`. */
  hoverable?: boolean
  /** Rendered in a full-width cell when there are no rows. Default `"No data."`. */
  emptyMessage?: React.ReactNode
  /** Extra classes for the underlying `<table>`. */
  className?: string
  /** Classes applied to every body `<tr>`. */
  rowClassName?: string
  /** Stable row id resolver (defaults to array index). */
  getRowId?: (originalRow: TData, index: number, parent?: Row<TData>) => string
  /** Invoked when a body row is clicked. */
  onRowClick?: (row: TData) => void
  /** Receives the underlying TanStack table instance (escape hatch for advanced usage). */
  onTableReady?: (table: TanStackTable<TData>) => void
}

function SortIndicator({ direction }: { direction: false | 'asc' | 'desc' }) {
  const Icon = direction === 'asc' ? ArrowUp : direction === 'desc' ? ArrowDown : ChevronsUpDown
  return (
    <Icon
      aria-hidden="true"
      className={cn(
        'ml-1.5 inline-block h-3 w-3 shrink-0',
        direction ? 'text-[var(--color-text-secondary)]' : 'text-[var(--color-text-muted)]/60',
      )}
    />
  )
}

/**
 * `DataTableView` is the behaviour layer over the `DataTable` styling primitives.
 *
 * It composes `@tanstack/react-table` (headless) with the existing
 * `DataTable`/`TableHeader`/`TableRow`/`TableHead`/`TableCell` markup, so sorting,
 * filtering and column state stop being reimplemented per page. The DOM, Tailwind
 * classes and Storybook baselines are unchanged — this is additive, the primitives
 * are untouched and remain available for render-only tables.
 */
export function DataTableView<TData extends RowData>({
  columns,
  data,
  enableSorting = true,
  sorting: sortingProp,
  onSortingChange,
  initialSorting,
  enableGlobalFilter = false,
  globalFilter: globalFilterProp,
  onGlobalFilterChange,
  hoverable = true,
  emptyMessage = 'No data.',
  className,
  rowClassName,
  getRowId,
  onRowClick,
  onTableReady,
}: DataTableViewProps<TData>) {
  const [internalSorting, setInternalSorting] = React.useState<SortingState>(initialSorting ?? [])
  const [internalGlobalFilter, setInternalGlobalFilter] = React.useState('')

  const sorting = sortingProp ?? internalSorting
  const globalFilter = globalFilterProp ?? internalGlobalFilter

  const table = useReactTable<TData>({
    data,
    columns,
    state: {
      sorting,
      ...(enableGlobalFilter && { globalFilter }),
    },
    enableSorting,
    enableGlobalFilter,
    onSortingChange: onSortingChange ?? setInternalSorting,
    onGlobalFilterChange: onGlobalFilterChange ?? setInternalGlobalFilter,
    getRowId,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
    getFilteredRowModel: enableGlobalFilter ? getFilteredRowModel() : undefined,
  })

  // `useReactTable` returns a new instance reference on every render, so notify
  // `onTableReady` exactly once (the name implies a one-time "ready" signal;
  // depending the effect on `table` would fire it every render and loop a caller
  // that stores the instance in state). The mount-time instance captured by
  // `useRef` is the one handed over — reading the table only when the effect runs
  // keeps `table` out of the dependency array without mutating a ref in render.
  const tableRef = React.useRef(table)
  const notifiedReadyRef = React.useRef(false)
  React.useEffect(() => {
    if (!notifiedReadyRef.current && onTableReady) {
      notifiedReadyRef.current = true
      onTableReady(tableRef.current)
    }
  }, [onTableReady])

  const rows = table.getRowModel().rows
  const columnCount = table.getAllLeafColumns().length

  return (
    <DataTable className={className}>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => {
              const canSort = header.column.getCanSort()
              const sortDirection = header.column.getIsSorted()
              const content = header.isPlaceholder
                ? null
                : flexRender(header.column.columnDef.header, header.getContext())

              return (
                <TableHead
                  key={header.id}
                  colSpan={header.colSpan}
                  aria-sort={
                    !canSort
                      ? undefined
                      : sortDirection === 'asc'
                        ? 'ascending'
                        : sortDirection === 'desc'
                          ? 'descending'
                          : 'none'
                  }
                >
                  {canSort ? (
                    <button
                      type="button"
                      onClick={header.column.getToggleSortingHandler()}
                      className="-mx-1 inline-flex items-center rounded px-1 py-0.5 font-medium uppercase tracking-wide text-inherit hover:text-[var(--color-text-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-text)] focus-visible:ring-offset-1"
                    >
                      {content}
                      <SortIndicator direction={sortDirection} />
                    </button>
                  ) : (
                    content
                  )}
                </TableHead>
              )
            })}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={columnCount}
              className="py-8 text-center text-[var(--color-text-muted)]"
            >
              {emptyMessage}
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row) => (
            <TableRow
              key={row.id}
              hoverable={hoverable}
              className={cn(onRowClick && 'cursor-pointer', rowClassName)}
              onClick={onRowClick ? () => onRowClick(row.original) : undefined}
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))
        )}
      </TableBody>
    </DataTable>
  )
}
