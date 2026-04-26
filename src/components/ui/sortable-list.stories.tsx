import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { GripVertical } from 'lucide-react'
import { SortableList } from './sortable-list'

const meta: Meta<typeof SortableList> = {
  title: 'UI/SortableList',
  component: SortableList,
  parameters: { layout: 'padded' },
}

export default meta
type Story = StoryObj<typeof SortableList>

interface SampleItem {
  id: string
  label: string
  description: string
}

const initialItems: SampleItem[] = [
  { id: '1', label: 'Welcome message', description: 'Greet the user on connect' },
  { id: '2', label: 'Detect glasses', description: 'Pair via BLE if available' },
  { id: '3', label: 'Capture photo', description: 'Open camera and stage upload' },
  { id: '4', label: 'Translate caption', description: 'Run translation on the result' },
]

function Wrapper({ items: initial }: { items: SampleItem[] }) {
  const [items, setItems] = React.useState(initial)
  return (
    <div className="w-[480px] border border-[var(--color-border)] rounded-lg divide-y divide-[var(--color-border)]/30">
      <SortableList
        items={items}
        onReorder={(orderedIds) => {
          const map = new Map(items.map((i) => [i.id, i]))
          setItems(orderedIds.flatMap((id) => (map.has(id) ? [map.get(id)!] : [])))
        }}
        renderItem={(item, dragHandle) => (
          <div className="flex items-center gap-3 p-3 bg-[var(--color-surface)]">
            <button
              type="button"
              ref={dragHandle.ref}
              {...dragHandle.props}
              className="cursor-grab text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              aria-label={`Drag ${item.label}`}
            >
              <GripVertical className="w-4 h-4" />
            </button>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-[var(--color-text)]">{item.label}</div>
              <div className="text-xs text-[var(--color-text-muted)]">{item.description}</div>
            </div>
          </div>
        )}
      />
    </div>
  )
}

export const Default: Story = {
  render: () => <Wrapper items={initialItems} />,
}

export const SingleItem: Story = {
  render: () => <Wrapper items={[initialItems[0]]} />,
}

export const Empty: Story = {
  render: () => (
    <div className="w-[480px] border border-dashed border-[var(--color-border)] rounded-lg p-6 text-center text-sm text-[var(--color-text-muted)]">
      No items to sort.
    </div>
  ),
}
