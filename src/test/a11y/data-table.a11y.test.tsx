import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { axe } from 'vitest-axe'
import {
  DataTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/data-table'

describe('DataTable (a11y)', () => {
  it('has no axe violations for a typical table with headers and rows', async () => {
    const { container } = render(
      <DataTable>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Role</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Jane Doe</TableCell>
            <TableCell>Engineer</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>John Smith</TableCell>
            <TableCell>Designer</TableCell>
          </TableRow>
        </TableBody>
      </DataTable>,
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
