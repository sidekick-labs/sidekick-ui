import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { axe } from 'vitest-axe'
import { GripVertical } from 'lucide-react'
import { SortableList } from '@/components/ui/sortable-list'

interface Item {
  id: string
  label: string
}

const items: Item[] = [
  { id: '1', label: 'First' },
  { id: '2', label: 'Second' },
  { id: '3', label: 'Third' },
]

describe('SortableList (a11y)', () => {
  it('has no axe violations for a list with drag handles', async () => {
    const { container } = render(
      <SortableList<Item>
        items={items}
        onReorder={() => {}}
        renderItem={(item, dragHandle) => (
          <div className="flex items-center gap-2">
            <button
              type="button"
              ref={dragHandle.ref}
              {...dragHandle.props}
              aria-label={`Reorder ${item.label}`}
            >
              <GripVertical aria-hidden="true" />
            </button>
            <span>{item.label}</span>
          </div>
        )}
      />,
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
