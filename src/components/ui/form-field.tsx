import * as React from 'react'
import { cn } from '@/lib/utils'

export type FormLabelProps = React.LabelHTMLAttributes<HTMLLabelElement>

const FormLabel = React.forwardRef<HTMLLabelElement, FormLabelProps>(
  ({ className, htmlFor, ...props }, ref) => {
    return (
      <label
        ref={ref}
        htmlFor={htmlFor}
        className={cn(
          'text-[11px] uppercase tracking-wider font-medium text-[var(--color-text-muted)] mb-2 block',
          className,
        )}
        {...props}
      />
    )
  },
)
FormLabel.displayName = 'FormLabel'

export interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
  /** Icon component rendered inside the input (left side). Automatically applies left padding. */
  icon?: React.ElementType<{ className?: string }>
}

const baseInputStyles =
  'w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] text-[var(--color-text)] text-sm focus:border-[var(--color-primary)] focus:outline-none transition-colors'

const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  ({ className, error, icon: Icon, ...props }, ref) => {
    if (Icon) {
      return (
        <div className="relative">
          <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none">
            <Icon className="w-4 h-4" />
          </div>
          <input
            ref={ref}
            aria-invalid={error ? true : undefined}
            className={cn(
              baseInputStyles,
              'pl-8',
              error && 'border-[var(--color-danger)]',
              className,
            )}
            {...props}
          />
        </div>
      )
    }
    return (
      <input
        ref={ref}
        aria-invalid={error ? true : undefined}
        className={cn(baseInputStyles, error && 'border-[var(--color-danger)]', className)}
        {...props}
      />
    )
  },
)
FormInput.displayName = 'FormInput'

export interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string
  options: Array<{ label: string; value: string }>
  placeholder?: string
}

const FormSelect = React.forwardRef<HTMLSelectElement, FormSelectProps>(
  ({ className, error, options, placeholder, ...props }, ref) => {
    return (
      <select
        ref={ref}
        aria-invalid={error ? true : undefined}
        className={cn(baseInputStyles, error && 'border-[var(--color-danger)]', className)}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    )
  },
)
FormSelect.displayName = 'FormSelect'

export interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string
}

const FormTextarea = React.forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        aria-invalid={error ? true : undefined}
        className={cn(
          baseInputStyles,
          'min-h-[80px] resize-y',
          error && 'border-[var(--color-danger)]',
          className,
        )}
        {...props}
      />
    )
  },
)
FormTextarea.displayName = 'FormTextarea'

export interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string
  error?: string
  /**
   * Associates the label and error message with the input.
   * Pass the same value as the input's `id` prop. The label will get
   * `htmlFor={inputId}` and the error message will get `id="{inputId}-error"`.
   *
   * For full screen reader support, set `aria-describedby="{inputId}-error"`
   * on the child input element manually.
   */
  inputId?: string
  children: React.ReactNode
}

const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  ({ className, label, error, inputId, children, ...props }, ref) => {
    const errorId = inputId && error ? `${inputId}-error` : undefined

    return (
      <div ref={ref} className={cn(className)} {...props}>
        {label && <FormLabel htmlFor={inputId}>{label}</FormLabel>}
        {children}
        {error && (
          <p id={errorId} className="text-xs text-[var(--color-danger)] mt-1" role="alert">
            {error}
          </p>
        )}
      </div>
    )
  },
)
FormField.displayName = 'FormField'

export { FormLabel, FormInput, FormSelect, FormTextarea, FormField }
