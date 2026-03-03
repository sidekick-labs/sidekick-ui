// Theme styles — consumers import via '@sidekick/ui/styles'
import './styles/theme.css'

// Utilities
export { cn } from './lib/utils'
export {
  formatDate,
  formatDateTime,
  formatDateTimeWithTimezone,
  formatRelativeTime,
  getBrowserTimezone,
} from './lib/format-date'
export { parseJsonError, formatJson } from './lib/json-utils'
export { isValidEmail } from './lib/validation'
export { isValidIpOrCidr, validateIpList } from './lib/ip-validation'
export type { IpValidationResult } from './lib/ip-validation'

// Hooks
export { useDebounce } from './hooks/use-debounce'
export { useIpValidation } from './hooks/use-ip-validation'

// Components
export * from './components/ui'

// Types
export type { PaginationMetadata } from './types/pagination'
