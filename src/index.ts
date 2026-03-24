// Theme styles — consumers import via '@sidekick-labs/ui/styles'
import './styles/index.css'

// Utilities
export { cn } from './lib/utils'
export {
  formatDate,
  formatDateTime,
  formatDateTimeWithTimezone,
  formatRelativeTime,
  getLocalTimezone,
} from './lib/format-date'
export { parseJsonError, formatJson } from './lib/json-utils'

// Hooks
export { useDebounce } from './hooks/use-debounce'

// UI primitives
export * from './components/ui'

// Business components
export { ChatMessage } from './components/business/chat-message'
export type { ChatMessageProps } from './components/business/chat-message'

export { ModelListItem } from './components/business/model-list-item'
export type {
  ModelListItemProps,
  ModelListItemModel,
  ModelCapability,
  ModelPricing,
} from './components/business/model-list-item'

// Types
export type { PaginationMetadata } from './types/pagination'
