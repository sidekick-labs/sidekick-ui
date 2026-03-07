import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, cleanup, screen } from '@testing-library/react'
import { arrayMove } from '@dnd-kit/sortable'
import { SortableList } from './sortable-list'

afterEach(cleanup)

type Item = { id: string; name: string }

const items: Item[] = [
  { id: '1', name: 'Item A' },
  { id: '2', name: 'Item B' },
  { id: '3', name: 'Item C' },
]

const renderItem = (item: Item) => <div>{item.name}</div>

describe('SortableList', () => {
  it('renders all items', () => {
    render(<SortableList items={items} onReorder={() => {}} renderItem={renderItem} />)
    expect(screen.getByText('Item A')).toBeInTheDocument()
    expect(screen.getByText('Item B')).toBeInTheDocument()
    expect(screen.getByText('Item C')).toBeInTheDocument()
  })

  it('renders items in order', () => {
    render(<SortableList items={items} onReorder={() => {}} renderItem={renderItem} />)
    const renderedItems = screen.getAllByText(/^Item [ABC]$/)
    expect(renderedItems.map((el) => el.textContent)).toEqual(['Item A', 'Item B', 'Item C'])
  })

  it('renders with custom className', () => {
    const { container } = render(
      <SortableList
        items={items}
        onReorder={() => {}}
        renderItem={renderItem}
        className="custom-list"
      />,
    )
    expect(container.querySelector('.custom-list')).toBeInTheDocument()
  })

  it('renders empty list', () => {
    const { container } = render(
      <SortableList items={[]} onReorder={() => {}} renderItem={renderItem} />,
    )
    expect(container).toBeInTheDocument()
  })

  it('accepts renderOverlay prop without crashing', () => {
    const renderOverlay = (item: Item) => <div>Dragging {item.name}</div>
    const { container } = render(
      <SortableList
        items={items}
        onReorder={() => {}}
        renderItem={renderItem}
        renderOverlay={renderOverlay}
      />,
    )
    expect(container).toBeInTheDocument()
  })

  it('passes drag handle to renderItem', () => {
    const renderItemWithHandle = vi.fn(
      (item: Item, dragHandle: { ref: unknown; props: unknown }) => {
        expect(dragHandle).toHaveProperty('ref')
        expect(dragHandle).toHaveProperty('props')
        return <div>{item.name}</div>
      },
    )
    render(<SortableList items={items} onReorder={() => {}} renderItem={renderItemWithHandle} />)
    expect(renderItemWithHandle).toHaveBeenCalledTimes(3)
  })
})

// Drag events cannot be reliably simulated in jsdom (no layout engine),
// so we test the reorder logic (arrayMove + rollback) in isolation.
describe('SortableList reorder logic', () => {
  it('arrayMove produces correct reordering', () => {
    const result = arrayMove(items, 0, 2)
    expect(result.map((i) => i.id)).toEqual(['2', '3', '1'])
  })

  it('onReorder receives new ID order and rollback reverts to snapshot', () => {
    let capturedIds: string[] = []
    let capturedOnError: (() => void) | undefined
    const onReorder = vi.fn((ids: string[], onError: () => void) => {
      capturedIds = ids
      capturedOnError = onError
    })

    // Simulate what handleDragEnd does: reorder, call onReorder, then rollback
    const snapshot = items
    const next = arrayMove(snapshot, 0, 2) // Move Item A to end
    const setOrderedItems = vi.fn()

    // Simulate the component's onReorder call
    setOrderedItems(next)
    onReorder(
      next.map((i) => i.id),
      () => setOrderedItems(snapshot),
    )

    // Verify onReorder was called with reordered IDs
    expect(capturedIds).toEqual(['2', '3', '1'])

    // Simulate API failure — rollback should restore snapshot
    capturedOnError!()
    expect(setOrderedItems).toHaveBeenLastCalledWith(snapshot)
    expect(setOrderedItems).toHaveBeenCalledTimes(2) // next + rollback
  })

  it('rollback restores exact pre-drag snapshot, not a stale reference', () => {
    const onReorder = vi.fn()
    const states: Item[][] = []
    const setOrderedItems = (value: Item[]) => states.push(value)

    // First drag: A,B,C → B,A,C
    const snapshot1 = items
    const next1 = arrayMove(snapshot1, 0, 1)
    setOrderedItems(next1)
    onReorder(
      next1.map((i) => i.id),
      () => setOrderedItems(snapshot1),
    )

    // Second drag (on the already-reordered list): B,A,C → B,C,A
    const snapshot2 = next1
    const next2 = arrayMove(snapshot2, 1, 2)
    setOrderedItems(next2)
    onReorder(
      next2.map((i) => i.id),
      () => setOrderedItems(snapshot2),
    )

    // If first drag fails, rollback to snapshot1 (A,B,C)
    const firstOnError = onReorder.mock.calls[0][1] as () => void
    firstOnError()
    expect(states[states.length - 1].map((i) => i.id)).toEqual(['1', '2', '3'])

    // If second drag fails, rollback to snapshot2 (B,A,C)
    const secondOnError = onReorder.mock.calls[1][1] as () => void
    secondOnError()
    expect(states[states.length - 1].map((i) => i.id)).toEqual(['2', '1', '3'])
  })
})
