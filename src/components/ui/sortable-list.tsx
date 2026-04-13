import * as React from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

/**
 * Props passed to renderItem so consumers can attach the drag handle
 * to whichever element they choose (e.g. a grip icon).
 *
 *   <div ref={dragHandle.ref} {...dragHandle.props}>
 *     <GripVertical />
 *   </div>
 */
export interface DragHandle {
  ref: (node: HTMLElement | null) => void
  props: Record<string, unknown>
}

export interface HasId {
  id: string
}

// --- SortableItem (internal) ---

interface SortableItemProps<T extends HasId> {
  item: T
  renderItem: (item: T, dragHandle: DragHandle) => React.ReactNode
}

function SortableItem<T extends HasId>({ item, renderItem }: SortableItemProps<T>) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={isDragging ? 'opacity-0' : undefined}
    >
      {renderItem(item, {
        ref: setActivatorNodeRef,
        props: { ...attributes, ...listeners },
      })}
    </div>
  )
}

// --- SortableList (public) ---

export interface SortableListProps<T extends HasId> {
  /** The ordered list of items to render. */
  items: T[]
  /**
   * Called after a drag with the new array of IDs in order.
   * Fire your API call here; the list optimistically updates immediately.
   * Call the provided `onError` callback if the request fails to roll back.
   *
   * Note: each `onError` closes over the snapshot from *its* drag. If a second
   * drag occurs while the first API call is still in-flight, rolling back the
   * first will discard the second. Consumers needing strict sequencing should
   * disable dragging while an API call is pending.
   */
  onReorder: (orderedIds: string[], onError: () => void) => void
  /**
   * Render each draggable row. The second argument provides the drag handle:
   * attach `dragHandle.ref` + `{...dragHandle.props}` to your grip element.
   */
  renderItem: (item: T, dragHandle: DragHandle) => React.ReactNode
  /**
   * Optional: render the floating overlay while dragging.
   * Defaults to rendering the item via `renderItem` with a no-op drag handle.
   */
  renderOverlay?: (item: T) => React.ReactNode
  className?: string
}

/**
 * Drag-and-drop sortable list with optimistic reordering and rollback.
 *
 * Requires peer dependencies: `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`.
 * These are marked optional in package.json — install them only if you use this component.
 */
export function SortableList<T extends HasId>({
  items,
  onReorder,
  renderItem,
  renderOverlay,
  className,
}: SortableListProps<T>) {
  const [orderedItems, setOrderedItems] = React.useState<T[]>(items)
  const [activeItem, setActiveItem] = React.useState<T | null>(null)

  // Sync when the parent refreshes items (skip while dragging to avoid
  // resetting the order mid-drag from polling/WebSocket updates).
  // activeItem is intentionally omitted — including it would cause the
  // effect to fire on drag-end (activeItem: non-null → null), overwriting
  // the optimistic reorder before the parent updates items.
  React.useEffect(() => {
    if (!activeItem) setOrderedItems(items)
  }, [items]) // eslint-disable-line @eslint-react/exhaustive-deps

  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Require an 8px drag before activating — prevents accidental
      // drags when clicking buttons inside the row.
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveItem(orderedItems.find((i) => i.id === active.id) ?? null)
  }

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveItem(null)
    if (!over || active.id === over.id) return

    const oldIndex = orderedItems.findIndex((i) => i.id === active.id)
    const newIndex = orderedItems.findIndex((i) => i.id === over.id)
    const snapshot = orderedItems
    const next = arrayMove(snapshot, oldIndex, newIndex)
    setOrderedItems(next)
    onReorder(
      next.map((i) => i.id),
      () => setOrderedItems(snapshot),
    )
  }

  const handleDragCancel = () => setActiveItem(null)

  const dndContextId = React.useId()

  const announcements = React.useMemo(
    () => ({
      onDragStart: ({ active }: { active: { id: string | number } }) =>
        `Picked up item ${active.id}.`,
      onDragOver: ({
        active,
        over,
      }: {
        active: { id: string | number }
        over: { id: string | number } | null
      }) => (over ? `Moving item ${active.id} over position ${over.id}.` : ''),
      onDragEnd: ({
        active,
        over,
      }: {
        active: { id: string | number }
        over: { id: string | number } | null
      }) =>
        over ? `Dropped item ${active.id} at position ${over.id}.` : `Item ${active.id} dropped.`,
      onDragCancel: ({ active }: { active: { id: string | number } }) =>
        `Drag cancelled. Item ${active.id} returned.`,
    }),
    [],
  )

  return (
    <DndContext
      id={dndContextId}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
      accessibility={{ announcements }}
    >
      <SortableContext items={orderedItems} strategy={verticalListSortingStrategy}>
        <div className={className}>
          {orderedItems.map((item) => (
            <SortableItem key={item.id} item={item} renderItem={renderItem} />
          ))}
        </div>
      </SortableContext>

      <DragOverlay>
        {activeItem &&
          (renderOverlay ? (
            renderOverlay(activeItem)
          ) : (
            <div className="opacity-80 shadow-lg cursor-grabbing">
              {renderItem(activeItem, { ref: () => {}, props: {} })}
            </div>
          ))}
      </DragOverlay>
    </DndContext>
  )
}
