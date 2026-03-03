import * as React from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Separator } from './separator'

const List = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={className} {...props} />,
)
List.displayName = 'List'

export type ListSectionProps = React.HTMLAttributes<HTMLDivElement> &
  (
    | { collapsible: true; title: string; defaultOpen?: boolean }
    | { collapsible?: false; title?: string; defaultOpen?: boolean }
  )

const ListSection = React.forwardRef<HTMLDivElement, ListSectionProps>(
  ({ className, title, children, collapsible = false, defaultOpen = true, ...props }, ref) => {
    const [isOpen, setIsOpen] = React.useState(defaultOpen)

    if (collapsible) {
      return (
        <div ref={ref} className={className} {...props}>
          <button
            type="button"
            aria-expanded={isOpen}
            onClick={() => setIsOpen(!isOpen)}
            className="flex w-full items-center py-3 text-sm font-medium text-[var(--color-text)] hover:text-[var(--color-text-secondary)] cursor-pointer uppercase"
          >
            <span>{title}</span>
            <Separator orientation="horizontal" dashed className="flex-1 mx-3" />
            <ChevronDown className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')} />
          </button>
          {isOpen && <div className="pb-3 space-y-1">{children}</div>}
        </div>
      )
    }

    return (
      <div
        ref={ref}
        className={cn('border-b border-[var(--color-border)] last:border-0 py-3', className)}
        {...props}
      >
        {title && <h4 className="text-sm font-medium text-[var(--color-text)] mb-2">{title}</h4>}
        <div className="space-y-1">{children}</div>
      </div>
    )
  },
)
ListSection.displayName = 'ListSection'

export type ListItemAction = {
  icon: React.ReactNode
  label: string
  onClick: () => void
}

export type ListItemProps = React.HTMLAttributes<HTMLDivElement> & {
  icon?: React.ReactNode
  prefix?: React.ReactNode
  suffix?: React.ReactNode
  active?: boolean
  actions?: ListItemAction[]
}

const ListItem = React.forwardRef<HTMLDivElement, ListItemProps>(
  ({ className, icon, prefix, suffix, active, actions = [], children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'group relative flex items-center gap-3 px-3 py-3 text-sm transition-colors border-b border-dashed border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-hover)]',
        active && 'bg-[var(--color-surface-hover)]',
        className,
      )}
      {...props}
    >
      {prefix && (
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--color-muted)] text-[var(--color-text)] font-medium text-xs">
          {prefix}
        </div>
      )}
      {icon && <div className="text-[var(--color-text-muted)]">{icon}</div>}
      {children}
      {suffix && <div className="text-[var(--color-text-muted)]">{suffix}</div>}

      {/* Action Links - Appear on Hover */}
      {actions.length > 0 && (
        <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1">
          {actions.map((action, index) => (
            <button
              type="button"
              key={`${action.label}-${index}`}
              onClick={action.onClick}
              className="w-10 h-10 flex items-center justify-center rounded-[var(--radius-sm)] hover:bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors cursor-pointer"
              aria-label={action.label}
              title={action.label}
            >
              <div className="w-4 h-4">{action.icon}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  ),
)
ListItem.displayName = 'ListItem'

const ListItemTitle = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('font-medium text-[var(--color-text)] truncate', className)}
      {...props}
    />
  ),
)
ListItemTitle.displayName = 'ListItemTitle'

const ListItemDescription = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('text-xs text-[var(--color-text-muted)] truncate', className)}
      {...props}
    />
  ),
)
ListItemDescription.displayName = 'ListItemDescription'

const ListItemMeta = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center gap-2 text-xs text-[var(--color-text-muted)]', className)}
      {...props}
    />
  ),
)
ListItemMeta.displayName = 'ListItemMeta'

export { List, ListSection, ListItem, ListItemTitle, ListItemDescription, ListItemMeta }
