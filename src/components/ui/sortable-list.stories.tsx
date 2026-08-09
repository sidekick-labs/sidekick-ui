import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { GripVertical } from 'lucide-react'
import { SortableList, type DragHandle } from './sortable-list'

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

/**
 * Shared row renderer. `data-testid="row"` marks list rows; the DragOverlay's
 * default rendering reuses this same renderer, so a mid-drag query returns one
 * extra row — that duplicate IS the evidence the overlay mounted.
 */
const renderRow = (item: SampleItem, dragHandle: DragHandle) => (
  <div
    data-testid="row"
    data-item-id={item.id}
    className="flex items-center gap-3 p-3 bg-[var(--color-surface)]"
  >
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
)

const listFrame =
  'w-[480px] border border-[var(--color-border)] rounded-lg divide-y divide-[var(--color-border)]/30'

function Wrapper({ items: initial }: { items: SampleItem[] }) {
  const [items, setItems] = React.useState(initial)
  return (
    <div className={listFrame}>
      <SortableList
        items={items}
        onReorder={(orderedIds) => {
          const map = new Map(items.map((i) => [i.id, i]))
          setItems(orderedIds.flatMap((id) => (map.has(id) ? [map.get(id)!] : [])))
        }}
        renderItem={renderRow}
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

// --- Interaction stories -----------------------------------------------------
//
// Drag-and-drop cannot be simulated in jsdom (no layout engine), but these
// stories run under the `storybook` Vitest project in REAL Chromium, where
// dnd-kit's KeyboardSensor (wired in sortable-list.tsx) performs a genuine
// reorder from Space → Arrow → Space with no pointer geometry involved.
//
// These drive the component's OWN handleDragStart / handleDragEnd / optimistic
// update / rollback closure — deleting any of them fails these stories.

/** Read the current list order straight out of the DOM. */
function domOrder(canvasElement: HTMLElement): string[] {
  return Array.from(canvasElement.querySelectorAll('[data-testid="row"]')).map(
    (el) => el.getAttribute('data-item-id') ?? '',
  )
}

/**
 * Space → ArrowDown → Space on a row's grip handle: dnd-kit picks the item up,
 * moves it one position down, and drops it.
 */
async function keyboardMoveDown(handle: HTMLElement, onPickedUp?: () => Promise<void> | void) {
  handle.focus()
  await userEvent.keyboard('[Space]')
  if (onPickedUp) await onPickedUp()
  await userEvent.keyboard('{ArrowDown}')
  await userEvent.keyboard('[Space]')
}

const reorderSpy = fn()

/**
 * A real keyboard-driven reorder. Asserts the resulting DOM order AND that the
 * component's own `onReorder` fired with the new ID order.
 */
export const KeyboardReorder: Story = {
  render: () => {
    function Harness() {
      const [items, setItems] = React.useState(initialItems)
      return (
        <div className={listFrame}>
          <SortableList
            items={items}
            onReorder={(orderedIds, onError) => {
              reorderSpy(orderedIds, onError)
              const map = new Map(items.map((i) => [i.id, i]))
              setItems(orderedIds.flatMap((id) => (map.has(id) ? [map.get(id)!] : [])))
            }}
            renderItem={renderRow}
          />
        </div>
      )
    }
    return <Harness />
  },
  play: async ({ canvasElement }) => {
    reorderSpy.mockClear()
    const canvas = within(canvasElement)

    await expect(domOrder(canvasElement)).toEqual(['1', '2', '3', '4'])

    await keyboardMoveDown(canvas.getByRole('button', { name: 'Drag Welcome message' }), () =>
      // Mid-drag: handleDragStart set activeItem, so the DragOverlay mounted a
      // 5th copy of the row using the default (no renderOverlay) branch.
      waitFor(() => expect(canvasElement.querySelectorAll('[data-testid="row"]')).toHaveLength(5)),
    )

    // The component's own onReorder fired with the new ID order and a rollback.
    await waitFor(() => expect(reorderSpy).toHaveBeenCalledTimes(1))
    await expect(reorderSpy.mock.calls[0][0]).toEqual(['2', '1', '3', '4'])
    await expect(typeof reorderSpy.mock.calls[0][1]).toBe('function')

    // The list really reordered, and the overlay unmounted on drag end.
    await waitFor(() => expect(domOrder(canvasElement)).toEqual(['2', '1', '3', '4']))
  },
}

const rollbackSpy = fn()

/**
 * The optimistic-update rollback path: the reorder is applied immediately, the
 * "server" then rejects, and the component's `onError` closure must restore the
 * exact pre-drag order. The rejection is deferred behind a button click so the
 * optimistic state is observably applied FIRST — a synchronous failure would
 * let a component that never applied the update at all pass.
 */
export const RollbackOnError: Story = {
  render: () => {
    function Harness() {
      // The parent deliberately never commits the new order: this models a
      // failed API call, so the only thing that can restore the list is the
      // component's own rollback closure.
      const [items] = React.useState(initialItems)
      const rollback = React.useRef<(() => void) | null>(null)
      const [pending, setPending] = React.useState(false)
      return (
        <div className="flex flex-col gap-3">
          <div className={listFrame}>
            <SortableList
              items={items}
              onReorder={(orderedIds, onError) => {
                rollbackSpy(orderedIds)
                rollback.current = onError
                setPending(true)
              }}
              renderItem={renderRow}
              renderOverlay={(item) => (
                <div
                  data-testid="custom-overlay"
                  className="p-3 rounded-md bg-[var(--color-surface)] shadow-lg text-sm text-[var(--color-text)]"
                >
                  {item.label}
                </div>
              )}
            />
          </div>
          <button
            type="button"
            disabled={!pending}
            onClick={() => {
              rollback.current?.()
              setPending(false)
            }}
            className="self-start rounded-md border border-[var(--color-border)] px-3 py-1.5 text-sm text-[var(--color-text)] disabled:opacity-50"
          >
            Fail the save
          </button>
        </div>
      )
    }
    return <Harness />
  },
  play: async ({ canvasElement }) => {
    rollbackSpy.mockClear()
    const canvas = within(canvasElement)

    await expect(domOrder(canvasElement)).toEqual(['1', '2', '3', '4'])

    await keyboardMoveDown(canvas.getByRole('button', { name: 'Drag Welcome message' }), () =>
      // renderOverlay branch: the custom overlay, not the default one.
      waitFor(() => expect(canvas.getByTestId('custom-overlay')).toBeInTheDocument()),
    )

    // Optimistic update landed even though the parent never changed `items`.
    await waitFor(() => expect(rollbackSpy).toHaveBeenCalledTimes(1))
    await expect(rollbackSpy.mock.calls[0][0]).toEqual(['2', '1', '3', '4'])
    await waitFor(() => expect(domOrder(canvasElement)).toEqual(['2', '1', '3', '4']))

    // Now the save fails — the rollback closure must restore the pre-drag order.
    await userEvent.click(canvas.getByRole('button', { name: 'Fail the save' }))
    await waitFor(() => expect(domOrder(canvasElement)).toEqual(['1', '2', '3', '4']))
  },
}
