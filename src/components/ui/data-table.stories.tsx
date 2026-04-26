import type { Meta, StoryObj } from '@storybook/react'
import { DataTable, TableHeader, TableBody, TableRow, TableHead, TableCell } from './data-table'
import { Status } from './status'

const meta: Meta<typeof DataTable> = {
  title: 'UI/DataTable',
  component: DataTable,
  parameters: { layout: 'padded' },
}

export default meta
type Story = StoryObj<typeof DataTable>

const sampleRows = [
  { id: 'dev-001', serial: 'SN-001-A', batch: 'Batch #42', status: 'active' as const },
  { id: 'dev-002', serial: 'SN-002-A', batch: 'Batch #42', status: 'completed' as const },
  { id: 'dev-003', serial: 'SN-003-B', batch: 'Batch #43', status: 'failed' as const },
  { id: 'dev-004', serial: 'SN-004-B', batch: 'Batch #43', status: 'processing' as const },
]

export const Default: Story = {
  render: () => (
    <DataTable className="w-[640px]">
      <TableHeader>
        <TableRow>
          <TableHead>Serial</TableHead>
          <TableHead>Batch</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sampleRows.map((row) => (
          <TableRow key={row.id}>
            <TableCell>{row.serial}</TableCell>
            <TableCell>{row.batch}</TableCell>
            <TableCell>
              <Status variant={row.status}>{row.status}</Status>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </DataTable>
  ),
}

export const Hoverable: Story = {
  render: () => (
    <DataTable className="w-[640px]">
      <TableHeader>
        <TableRow>
          <TableHead>Serial</TableHead>
          <TableHead>Batch</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sampleRows.map((row) => (
          <TableRow key={row.id} hoverable>
            <TableCell>{row.serial}</TableCell>
            <TableCell>{row.batch}</TableCell>
            <TableCell>
              <Status variant={row.status}>{row.status}</Status>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </DataTable>
  ),
}

export const Empty: Story = {
  render: () => (
    <DataTable className="w-[640px]">
      <TableHeader>
        <TableRow>
          <TableHead>Serial</TableHead>
          <TableHead>Batch</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell colSpan={3} className="text-center text-[var(--color-text-muted)] py-8">
            No devices yet.
          </TableCell>
        </TableRow>
      </TableBody>
    </DataTable>
  ),
}
