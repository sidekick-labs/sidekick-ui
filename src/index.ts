// Theme styles — consumers import via '@sidekick-labs/ui/styles'
import './styles/theme.css'

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
export { isValidEmail } from './lib/validation'
export { isValidIpOrCidr, validateIpList } from './lib/ip-validation'
export type { IpValidationResult } from './lib/ip-validation'

// Hooks
export { useDebounce } from './hooks/use-debounce'
export { useIpValidation } from './hooks/use-ip-validation'

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
