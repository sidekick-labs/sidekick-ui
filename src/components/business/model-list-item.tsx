import * as React from 'react'
import { Zap, Cog, Package, Eye, HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ListItem, ListItemTitle, ListItemMeta } from '@/components/ui/list'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'

export interface ModelPricing {
  inputTokenCost?: string
  outputTokenCost?: string
}

/** Known capability identifiers; arbitrary strings are also accepted. */
export type ModelCapability =
  | 'streaming'
  | 'function_calling'
  | 'batch'
  | 'vision'
  | (string & Record<never, never>)

export interface ModelListItemModel {
  id: string
  name: string
  provider: string
  family?: string
  contextWindow?: number | null
  /** Only rendered when contextWindow is also provided. */
  maxOutputTokens?: number | null
  capabilities?: ModelCapability[]
  pricing?: ModelPricing
  knowledgeCutoff?: string
}

export interface ModelListItemProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  model: ModelListItemModel
  selected?: boolean
  onSelect?: (model: ModelListItemModel) => void
}

const capabilityIcons: Record<
  string,
  { Icon: React.ComponentType<{ className?: string }>; label: string }
> = {
  streaming: { Icon: Zap, label: 'Streaming' },
  function_calling: { Icon: Cog, label: 'Function Calling' },
  batch: { Icon: Package, label: 'Batch' },
  vision: { Icon: Eye, label: 'Vision' },
}

function formatCapabilityLabel(capability: string): string {
  return capability.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function getCapabilityIcon(capability: string) {
  return (
    capabilityIcons[capability] ?? {
      Icon: HelpCircle,
      label: formatCapabilityLabel(capability),
    }
  )
}

function formatTokenCount(tokens: number): string {
  if (tokens >= 1_000_000) {
    const m = tokens / 1_000_000
    return m % 1 === 0 ? `${m}M` : `${m.toFixed(1)}M`
  }
  if (tokens >= 1000) {
    return `${Math.round(tokens / 1000)}K`
  }
  return `${tokens}`
}

const ModelListItem = React.forwardRef<HTMLDivElement, ModelListItemProps>(
  ({ model, selected = false, onSelect, className, ...props }, ref) => {
    const hasInputCost =
      model.pricing?.inputTokenCost != null && model.pricing.inputTokenCost !== ''
    const hasOutputCost =
      model.pricing?.outputTokenCost != null && model.pricing.outputTokenCost !== ''

    return (
      <ListItem
        ref={ref}
        role={onSelect ? 'button' : undefined}
        tabIndex={onSelect ? 0 : undefined}
        aria-pressed={onSelect ? selected : undefined}
        onClick={onSelect ? () => onSelect(model) : undefined}
        onKeyDown={
          onSelect
            ? (e: React.KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onSelect(model)
                }
              }
            : undefined
        }
        active={selected}
        className={cn(
          onSelect &&
            'cursor-pointer focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:outline-none',
          className,
        )}
        {...props}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <ListItemTitle>{model.name}</ListItemTitle>
            {model.capabilities && model.capabilities.length > 0 && (
              <div className="flex items-center gap-1.5">
                {model.capabilities.map((cap) => {
                  const { Icon, label } = getCapabilityIcon(cap)
                  return (
                    <Tooltip key={cap}>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="flex items-center justify-center text-[var(--color-info)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-primary)] rounded-sm"
                          onClick={onSelect ? (e) => e.stopPropagation() : undefined}
                        >
                          <Icon className="h-4 w-4" aria-hidden="true" />
                          <span className="sr-only">{label}</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>{label}</TooltipContent>
                    </Tooltip>
                  )
                })}
              </div>
            )}
          </div>
          <div className="mt-2 flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
            <span>{model.provider}</span>
            {model.family && (
              <>
                <span>·</span>
                <span className="text-[var(--color-text)]">{model.family}</span>
              </>
            )}
            {model.contextWindow != null && model.contextWindow > 0 && (
              <>
                <span>·</span>
                <span>
                  Input: {formatTokenCount(model.contextWindow)}
                  {model.maxOutputTokens != null &&
                    model.maxOutputTokens > 0 &&
                    ` / Output: ${formatTokenCount(model.maxOutputTokens)}`}
                </span>
              </>
            )}
          </div>
          <ListItemMeta className="mt-2">
            {hasInputCost && <span>${model.pricing!.inputTokenCost}/1M in</span>}
            {hasInputCost && hasOutputCost && <span>·</span>}
            {hasOutputCost && <span>${model.pricing!.outputTokenCost}/1M out</span>}
            {(hasInputCost || hasOutputCost) && model.knowledgeCutoff && <span>·</span>}
            {model.knowledgeCutoff && <span>Updated: {model.knowledgeCutoff}</span>}
          </ListItemMeta>
        </div>
      </ListItem>
    )
  },
)
ModelListItem.displayName = 'ModelListItem'

export { ModelListItem }
