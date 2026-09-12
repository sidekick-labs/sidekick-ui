import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { axe } from 'vitest-axe'
import { createColumnHelper } from '@tanstack/react-table'
import { DataTableView } from '@/components/ui/data-table-view'

type Person = { id: string; name: string; role: string }

const data: Person[] = [
  { id: '1', name: 'Jane Doe', role: 'Engineer' },
  { id: '2', name: 'John Smith', role: 'Designer' },
]

const column = createColumnHelper<Person>()
const columns = [
  column.accessor('name', { header: 'Name' }),
  column.accessor('role', { header: 'Role', enableSorting: false }),
] as Parameters<typeof DataTableView<Person>>[0]['columns']

describe('DataTableView (a11y)', () => {
  it('has no axe violations for a sortable table with headers and rows', async () => {
    const { container } = render(<DataTableView columns={columns} data={data} />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('has no axe violations in the empty state', async () => {
    const { container } = render(
      <DataTableView columns={columns} data={[]} emptyMessage="No people yet." />,
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
