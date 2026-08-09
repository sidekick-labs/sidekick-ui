import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, cleanup, screen } from '@testing-library/react'
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

  it('renders an empty list container with no rows', () => {
    const { container } = render(
      <SortableList items={[]} onReorder={() => {}} renderItem={renderItem} className="the-list" />,
    )
    const list = container.querySelector('.the-list')
    expect(list).not.toBeNull()
    expect(list!.children).toHaveLength(0)
  })

  it('does not render the drag overlay while idle', () => {
    const renderOverlay = (item: Item) => <div>Dragging {item.name}</div>
    render(
      <SortableList
        items={items}
        onReorder={() => {}}
        renderItem={renderItem}
        renderOverlay={renderOverlay}
      />,
    )
    // The overlay only mounts once handleDragStart sets an active item.
    expect(screen.queryByText(/^Dragging /)).not.toBeInTheDocument()
    expect(screen.getAllByText(/^Item [ABC]$/)).toHaveLength(3)
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

// Drag behaviour is NOT tested here.
//
// This file previously carried a `describe('SortableList reorder logic')` block
// that hand-rolled a simulation of `handleDragEnd` from `arrayMove` plus local
// `vi.fn()`s and asserted on its own simulation. It never rendered the
// component, so gutting the real `handleDragEnd` left all of it green — a test
// that would survive deleting the implementation is worse than no test.
//
// The real drag coverage lives in `sortable-list.stories.tsx`, in the
// `KeyboardReorder` and `RollbackOnError` play functions. Those run under the
// `storybook` Vitest project in real Chromium, where dnd-kit's KeyboardSensor
// performs a genuine Space / ArrowDown / Space reorder with no pointer geometry
// required — driving the component's own handleDragStart, handleDragEnd,
// optimistic update, `onError` rollback closure and both DragOverlay branches.
// Verified by mutation: gutting `handleDragEnd` fails both stories, and
// replacing the rollback closure with a no-op fails `RollbackOnError` alone.
