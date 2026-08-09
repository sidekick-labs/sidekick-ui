import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, cleanup, screen, fireEvent, act } from '@testing-library/react'
import { SortableList, type DragHandle } from './sortable-list'

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

// --- Real drag behaviour --------------------------------------------------
//
// This file previously carried a `describe('SortableList reorder logic')` block
// that hand-rolled a simulation of `handleDragEnd` from `arrayMove` plus local
// `vi.fn()`s and asserted on its own simulation (one case asserted `arrayMove`,
// a third-party function). It never rendered the component, so gutting the real
// `handleDragEnd` left all three cases green. It is gone: a test that survives
// deleting the implementation it names is worse than no test.
//
// What replaces it drives the component itself, in two places:
//
//  1. The `KeyboardReorder` / `RollbackOnError` play functions in
//     `sortable-list.stories.tsx`, which run under the `storybook` Vitest
//     project in REAL Chromium — the authoritative check, with a genuine
//     layout engine and genuine key events.
//  2. The jsdom cases below, which exist so the drag paths also land in the
//     coverage report (`test:coverage` measures the `unit` project only).
//
// The old comment claimed drag "cannot be reliably simulated in jsdom". What
// jsdom actually lacks is a LAYOUT engine — dnd-kit needs element rects to
// resolve a drop target. Stub `getBoundingClientRect` into a plausible vertical
// stack and dnd-kit's KeyboardSensor (wired in `sortable-list.tsx`) does the
// rest: Space picks up, ArrowDown moves, Space drops, and the component's own
// `handleDragStart` / `handleDragEnd` / rollback closure run for real. Only the
// geometry is faked; none of the component's logic is.

const ROW_HEIGHT = 50

const fakeRect = (x: number, y: number, w: number, h: number) =>
  ({
    x,
    y,
    left: x,
    top: y,
    width: w,
    height: h,
    right: x + w,
    bottom: y + h,
    toJSON: () => ({}),
  }) as DOMRect

/** The list element whose children are laid out as a vertical stack. */
let laidOutList: HTMLElement | null = null

const dragRenderItem = (item: Item, dragHandle: DragHandle) => (
  <div data-item-id={item.id}>
    <button
      type="button"
      ref={dragHandle.ref}
      {...dragHandle.props}
      aria-label={`Drag ${item.name}`}
    >
      grip
    </button>
    <span>{item.name}</span>
  </div>
)

function currentOrder(): string[] {
  return Array.from(laidOutList!.children).map((el) => {
    const row = el.querySelector('[data-item-id]') ?? el
    return row.getAttribute('data-item-id') ?? ''
  })
}

/** Render with a stubbed vertical layout so dnd-kit can resolve drop targets. */
function renderSortable(props: Partial<React.ComponentProps<typeof SortableList<Item>>> = {}) {
  const onReorder = vi.fn()
  const view = render(
    <SortableList
      items={items}
      onReorder={onReorder}
      renderItem={dragRenderItem}
      className="drag-list"
      {...props}
    />,
  )
  laidOutList = view.container.querySelector('.drag-list') as HTMLElement
  return { ...view, onReorder }
}

/** Stubbed geometry: the list is a vertical stack of equal-height rows. */
function measure(element: Element): DOMRect {
  const list = laidOutList
  if (!list) return fakeRect(0, 0, 0, 0)
  if (element === list) return fakeRect(0, 0, 300, ROW_HEIGHT * list.children.length)
  // Any descendant of a row reports that row's box — enough for
  // closestCenter, and it is what the activator handle needs.
  let node: Element | null = element
  while (node && node.parentElement !== list) node = node.parentElement
  if (node) {
    const index = Array.prototype.indexOf.call(list.children, node)
    return fakeRect(0, index * ROW_HEIGHT, 300, ROW_HEIGHT)
  }
  return fakeRect(0, 0, 300, ROW_HEIGHT * list.children.length)
}

async function press(key: string) {
  const target = document.activeElement ?? document.body
  // async act: dnd-kit settles drag start/end across a rAF tick.
  await act(async () => {
    fireEvent.keyDown(target, { key, code: key === ' ' ? 'Space' : key })
  })
}

describe('SortableList keyboard drag', () => {
  beforeEach(() => {
    // dnd-kit observes element size; jsdom ships no ResizeObserver.
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    )
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: Element,
    ) {
      return measure(this)
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    laidOutList = null
  })

  it('reorders the list and reports the new ID order to onReorder', async () => {
    const { onReorder } = renderSortable()
    expect(currentOrder()).toEqual(['1', '2', '3'])

    screen.getByRole('button', { name: 'Drag Item A' }).focus()
    await press(' ')
    await press('ArrowDown')
    await press(' ')

    expect(currentOrder()).toEqual(['2', '1', '3'])
    expect(onReorder).toHaveBeenCalledTimes(1)
    expect(onReorder.mock.calls[0][0]).toEqual(['2', '1', '3'])
    expect(typeof onReorder.mock.calls[0][1]).toBe('function')
  })

  it('rolls the optimistic update back to the pre-drag order when onError fires', async () => {
    const { onReorder } = renderSortable()

    screen.getByRole('button', { name: 'Drag Item A' }).focus()
    await press(' ')
    await press('ArrowDown')
    await press(' ')

    // Optimistically applied while the "request" is in flight.
    expect(currentOrder()).toEqual(['2', '1', '3'])

    const rollback = onReorder.mock.calls[0][1] as () => void
    await act(async () => rollback())

    expect(currentOrder()).toEqual(['1', '2', '3'])
  })

  it('mounts the drag overlay while an item is picked up and unmounts it on drop', async () => {
    renderSortable({ renderOverlay: (item: Item) => <div>Dragging {item.name}</div> })

    screen.getByRole('button', { name: 'Drag Item A' }).focus()
    await press(' ')
    expect(screen.getByText('Dragging Item A')).toBeInTheDocument()

    await press('ArrowDown')
    await press(' ')
    expect(screen.queryByText(/^Dragging /)).not.toBeInTheDocument()
  })

  it('leaves the order untouched when the drag is cancelled with Escape', async () => {
    const { onReorder } = renderSortable()

    screen.getByRole('button', { name: 'Drag Item A' }).focus()
    await press(' ')
    await press('ArrowDown')
    await press('Escape')

    expect(currentOrder()).toEqual(['1', '2', '3'])
    expect(onReorder).not.toHaveBeenCalled()
  })

  // NOTE: the `active.id === over.id` early return (pick up, drop straight back
  // down) is asserted in the `KeyboardReorder` story instead. The stubbed
  // layout here does not reproduce dnd-kit's start-of-drag collision state
  // faithfully enough to trust the result — real geometry does.

  it('adopts a new items prop while idle', () => {
    const { rerender } = renderSortable()
    rerender(
      <SortableList
        items={[items[2], items[0], items[1]]}
        onReorder={() => {}}
        renderItem={dragRenderItem}
        className="drag-list"
      />,
    )
    expect(currentOrder()).toEqual(['3', '1', '2'])
  })
})
