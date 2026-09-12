import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, cleanup, fireEvent, within } from '@testing-library/react'
import { createColumnHelper } from '@tanstack/react-table'
import type { SortingState } from '@tanstack/react-table'
import { useState } from 'react'
import { DataTableView } from './data-table-view'

afterEach(cleanup)

type Row = { id: string; name: string; age: number }

const rows: Row[] = [
  { id: '1', name: 'Charlie', age: 30 },
  { id: '2', name: 'Alice', age: 42 },
  { id: '3', name: 'Bob', age: 25 },
]

const column = createColumnHelper<Row>()
const columns = [
  column.accessor('name', { header: 'Name' }),
  column.accessor('age', { header: 'Age' }),
  column.display({ id: 'actions', header: 'Actions', enableSorting: false, cell: () => 'Edit' }),
] as Parameters<typeof DataTableView<Row>>[0]['columns']

function cellTextsByColumn(container: HTMLElement, columnIndex: number): string[] {
  return Array.from(container.querySelectorAll('tbody tr')).map(
    (tr) => tr.querySelectorAll('td')[columnIndex]?.textContent ?? '',
  )
}

describe('DataTableView', () => {
  it('renders headers and all rows via the DataTable primitives', () => {
    const { container } = render(<DataTableView columns={columns} data={rows} />)
    expect(within(container).getByText('Name')).toBeInTheDocument()
    expect(within(container).getByText('Age')).toBeInTheDocument()
    expect(container.querySelectorAll('tbody tr')).toHaveLength(3)
    // Same DOM shape as the styling primitives: a single <table>.
    expect(container.querySelectorAll('table')).toHaveLength(1)
  })

  it('renders sortable headers as buttons and non-sortable ones as plain text', () => {
    const { container } = render(<DataTableView columns={columns} data={rows} />)
    expect(within(container).getByRole('button', { name: /name/i })).toBeInTheDocument()
    expect(within(container).getByRole('button', { name: /age/i })).toBeInTheDocument()
    expect(within(container).queryByRole('button', { name: /actions/i })).not.toBeInTheDocument()
  })

  it('sorts ascending then descending when a sortable header is clicked', () => {
    const { container } = render(<DataTableView columns={columns} data={rows} />)
    // Unsorted: original order preserved.
    expect(cellTextsByColumn(container, 0)).toEqual(['Charlie', 'Alice', 'Bob'])

    const nameHeader = within(container).getByRole('button', { name: /name/i })
    fireEvent.click(nameHeader)
    expect(cellTextsByColumn(container, 0)).toEqual(['Alice', 'Bob', 'Charlie'])

    fireEvent.click(nameHeader)
    expect(cellTextsByColumn(container, 0)).toEqual(['Charlie', 'Bob', 'Alice'])
  })

  it('exposes sort direction through aria-sort', () => {
    const { container } = render(<DataTableView columns={columns} data={rows} />)
    const nameHeader = within(container).getByRole('button', { name: /name/i })
    const th = nameHeader.closest('th')!
    expect(th).toHaveAttribute('aria-sort', 'none')
    fireEvent.click(nameHeader)
    expect(th).toHaveAttribute('aria-sort', 'ascending')
    fireEvent.click(nameHeader)
    expect(th).toHaveAttribute('aria-sort', 'descending')
  })

  it('does not set aria-sort on non-sortable columns', () => {
    const { container } = render(<DataTableView columns={columns} data={rows} />)
    const actionsTh = within(container).getByText('Actions').closest('th')!
    expect(actionsTh).not.toHaveAttribute('aria-sort')
  })

  it('honours initialSorting', () => {
    const { container } = render(
      <DataTableView columns={columns} data={rows} initialSorting={[{ id: 'age', desc: true }]} />,
    )
    expect(cellTextsByColumn(container, 1)).toEqual(['42', '30', '25'])
  })

  it('supports controlled sorting state', () => {
    function Controlled() {
      const [sorting, setSorting] = useState<SortingState>([])
      return (
        <DataTableView
          columns={columns}
          data={rows}
          sorting={sorting}
          onSortingChange={setSorting}
        />
      )
    }
    const { container } = render(<Controlled />)
    fireEvent.click(within(container).getByRole('button', { name: /name/i }))
    expect(cellTextsByColumn(container, 0)).toEqual(['Alice', 'Bob', 'Charlie'])
  })

  it('renders the empty message when there are no rows', () => {
    const { container } = render(
      <DataTableView columns={columns} data={[]} emptyMessage="Nothing here." />,
    )
    expect(within(container).getByText('Nothing here.')).toBeInTheDocument()
    // The empty cell spans every leaf column.
    expect(container.querySelector('tbody td')!.getAttribute('colspan')).toBe('3')
  })

  it('disables sorting entirely when enableSorting is false', () => {
    const { container } = render(
      <DataTableView columns={columns} data={rows} enableSorting={false} />,
    )
    expect(within(container).queryByRole('button', { name: /name/i })).not.toBeInTheDocument()
    expect(cellTextsByColumn(container, 0)).toEqual(['Charlie', 'Alice', 'Bob'])
  })

  it('invokes onRowClick with the original row', () => {
    const onRowClick = vi.fn()
    const { container } = render(
      <DataTableView columns={columns} data={rows} onRowClick={onRowClick} />,
    )
    fireEvent.click(container.querySelector('tbody tr')!)
    expect(onRowClick).toHaveBeenCalledWith(rows[0])
  })

  it('notifies onTableReady exactly once with the table instance, not on every re-render', () => {
    const onTableReady = vi.fn()
    const { container } = render(
      <DataTableView columns={columns} data={rows} onTableReady={onTableReady} />,
    )
    expect(onTableReady).toHaveBeenCalledTimes(1)
    const table = onTableReady.mock.calls[0][0]
    expect(typeof table.getRowModel).toBe('function')

    // A re-render (triggered here by a sort click) must not re-fire the callback —
    // `useReactTable` returns a fresh instance each render, so a naive
    // effect dependency would loop a caller that stores the instance in state.
    fireEvent.click(within(container).getByRole('button', { name: /name/i }))
    expect(onTableReady).toHaveBeenCalledTimes(1)
  })
})
