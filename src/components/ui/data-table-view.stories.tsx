import type { Meta, StoryObj } from '@storybook/react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { createColumnHelper } from '@tanstack/react-table'
import { DataTableView } from './data-table-view'
import { Status } from './status'

type Device = {
  id: string
  serial: string
  batch: string
  status: 'active' | 'completed' | 'failed' | 'processing'
}

const sampleRows: Device[] = [
  { id: 'dev-003', serial: 'SN-003-B', batch: 'Batch #43', status: 'failed' },
  { id: 'dev-001', serial: 'SN-001-A', batch: 'Batch #42', status: 'active' },
  { id: 'dev-004', serial: 'SN-004-B', batch: 'Batch #43', status: 'processing' },
  { id: 'dev-002', serial: 'SN-002-A', batch: 'Batch #42', status: 'completed' },
]

const column = createColumnHelper<Device>()

const columns = [
  column.accessor('serial', { header: 'Serial' }),
  column.accessor('batch', { header: 'Batch' }),
  column.accessor('status', {
    header: 'Status',
    enableSorting: false,
    cell: (info) => <Status variant={info.getValue()}>{info.getValue()}</Status>,
  }),
] as Parameters<typeof DataTableView<Device>>[0]['columns']

const meta: Meta<typeof DataTableView<Device>> = {
  title: 'UI/DataTableView',
  component: DataTableView,
  parameters: { layout: 'padded' },
}

export default meta
type Story = StoryObj<typeof DataTableView<Device>>

export const Default: Story = {
  render: () => (
    <div className="w-[640px]">
      <DataTableView columns={columns} data={sampleRows} />
    </div>
  ),
}

export const Sortable: Story = {
  render: () => (
    <div className="w-[640px]">
      <DataTableView
        columns={columns}
        data={sampleRows}
        initialSorting={[{ id: 'serial', desc: false }]}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // Initial ascending order by serial.
    const firstCell = () => canvas.getAllByRole('cell')[0]
    await waitFor(() => expect(firstCell()).toHaveTextContent('SN-001-A'))

    // Toggle the Serial header to descending.
    const serialHeader = canvas.getByRole('button', { name: /serial/i })
    await userEvent.click(serialHeader)
    await waitFor(() => expect(firstCell()).toHaveTextContent('SN-004-B'))

    // The sorted column exposes its direction to assistive tech.
    const th = serialHeader.closest('th')
    await waitFor(() => expect(th).toHaveAttribute('aria-sort', 'descending'))
  },
}

export const Empty: Story = {
  render: () => (
    <div className="w-[640px]">
      <DataTableView columns={columns} data={[]} emptyMessage="No devices yet." />
    </div>
  ),
}
