import * as React from 'react'
import { AlignLeft, Loader2 } from 'lucide-react'
import { Button } from './button'
import { Callout } from './callout'
import { cn } from '@/lib/utils'
import { parseJsonError, formatJson } from '@/lib/json-utils'

export interface JsonEditorProps {
  /** The JSON string value */
  value: string
  /** Called when the value changes */
  onChange: (value: string) => void
  /**
   * Optional async validator — receives parsed JSON, returns error messages.
   * Wrap in `useCallback` to avoid unnecessary re-validation on re-renders.
   */
  onValidate?: (data: unknown) => Promise<string[]>
  /** Validation errors from form submission (array of error messages) */
  errors?: string[]
  /** Optional placeholder text */
  placeholder?: string
  /** Number of visible rows */
  rows?: number
  /** Helper text shown below the editor */
  helperText?: string
  /** Schema hints to display (property descriptions from JSON schema) */
  schemaHints?: SchemaHint[]
  /** Label for the field */
  label?: string
  /** Whether the field is disabled */
  disabled?: boolean
  /** Additional class names */
  className?: string
}

export interface SchemaHint {
  name: string
  type: string
  description?: string
  required?: boolean
}

/**
 * A JSON editor component with formatting, validation feedback, and optional schema hints.
 *
 * When an `onValidate` prop is provided, validates parsed JSON on debounced changes,
 * providing real-time feedback without form submission.
 */
const JsonEditor = React.forwardRef<HTMLTextAreaElement, JsonEditorProps>(
  (
    {
      value,
      onChange,
      onValidate,
      errors,
      placeholder,
      rows = 12,
      helperText,
      schemaHints,
      label,
      disabled = false,
      className,
    },
    ref,
  ) => {
    const inputId = React.useId()
    const errorId = `${inputId}-errors`
    const [syntaxError, setSyntaxError] = React.useState<string | null>(null)
    const [schemaErrors, setSchemaErrors] = React.useState<string[]>([])
    const [isValidating, setIsValidating] = React.useState(false)

    // Check for syntax errors and validate on debounced changes
    React.useEffect(() => {
      if (!value || value.trim() === '') {
        setSyntaxError(null)
        setSchemaErrors([])
        return
      }

      // First check syntax
      const syntaxErr = parseJsonError(value)
      setSyntaxError(syntaxErr)

      // If syntax is invalid or no validator provided, skip validation
      if (syntaxErr || !onValidate) {
        setSchemaErrors([])
        return
      }

      // Debounced validation
      let cancelled = false
      const timeout = setTimeout(async () => {
        setIsValidating(true)
        try {
          const parsedData = JSON.parse(value)
          const validationErrors = await onValidate(parsedData)
          if (!cancelled) setSchemaErrors(validationErrors)
        } catch {
          // Silently swallow — consumers handle their own error logging
          // inside onValidate. We only catch here to prevent unhandled
          // rejection from crashing the debounce timer.
        } finally {
          if (!cancelled) setIsValidating(false)
        }
      }, 500)

      return () => {
        cancelled = true
        clearTimeout(timeout)
      }
    }, [value, onValidate])

    const handleFormat = () => {
      const formatted = formatJson(value)
      if (formatted !== value) {
        onChange(formatted)
      }
    }

    const canFormat = !syntaxError && value.trim() !== ''

    // Combine all error sources: syntax errors, schema errors, and form submission errors
    const allErrors = React.useMemo(() => {
      const result: string[] = []
      if (syntaxError) result.push(syntaxError)
      if (schemaErrors.length > 0) result.push(...schemaErrors)
      if (errors) result.push(...errors)
      return result
    }, [syntaxError, schemaErrors, errors])

    const hasErrors = allErrors.length > 0

    return (
      <div className={cn('space-y-2', className)}>
        {/* Header with label and format button */}
        <div className={cn('flex items-center', label ? 'justify-between' : 'justify-end')}>
          {label && (
            <label htmlFor={inputId} className="block text-sm font-medium text-[var(--color-text)]">
              {label}
            </label>
          )}
          <div className="flex items-center gap-1">
            {isValidating && (
              <Loader2 className="w-3 h-3 animate-spin text-[var(--color-text-muted)]" />
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleFormat}
              disabled={disabled || !canFormat}
              className="text-xs"
            >
              <AlignLeft className="w-3 h-3 mr-1" />
              Format
            </Button>
          </div>
        </div>

        {/* Error display */}
        {hasErrors && (
          <Callout id={errorId} variant="danger" title="Validation Error">
            <ul className="list-disc list-inside space-y-1">
              {allErrors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </Callout>
        )}

        {/* Textarea */}
        <textarea
          id={inputId}
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          disabled={disabled}
          placeholder={placeholder}
          aria-invalid={hasErrors || undefined}
          aria-describedby={hasErrors ? errorId : undefined}
          className={cn(
            'w-full px-3 py-2 rounded-lg border bg-[var(--color-background)] text-[var(--color-text)] font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-colors',
            hasErrors
              ? 'border-[var(--color-danger)] focus:ring-[var(--color-danger)]'
              : 'border-[var(--color-border)]',
            disabled && 'opacity-50 cursor-not-allowed',
          )}
        />

        {/* Helper text */}
        {helperText && <p className="text-xs text-[var(--color-text-muted)]">{helperText}</p>}

        {/* Schema hints */}
        {schemaHints && schemaHints.length > 0 && (
          <details className="text-xs">
            <summary className="cursor-pointer text-[var(--color-text-muted)] hover:text-[var(--color-text)] select-none">
              Expected properties
            </summary>
            <div className="mt-2 p-3 rounded-lg bg-[var(--color-background-secondary)] border border-[var(--color-border)]">
              <ul className="space-y-1.5">
                {schemaHints.map((hint) => (
                  <li key={hint.name} className="flex items-start gap-2">
                    <code className="text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-1 rounded">
                      {hint.name}
                    </code>
                    <span className="text-[var(--color-text-muted)]">
                      ({hint.type})
                      {hint.required && <span className="text-[var(--color-danger)] ml-1">*</span>}
                      {hint.description && ` — ${hint.description}`}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </details>
        )}
      </div>
    )
  },
)
JsonEditor.displayName = 'JsonEditor'

export { JsonEditor }
