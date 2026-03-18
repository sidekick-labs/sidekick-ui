import * as React from 'react'
import { cn } from '@/lib/utils'

export type FormLabelProps = React.LabelHTMLAttributes<HTMLLabelElement>

const FormLabel = React.forwardRef<HTMLLabelElement, FormLabelProps>(
  ({ className, ...props }, ref) => {
    return (
      <label
        ref={ref}
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
  variant?: 'default' | 'search'
}

const baseInputStyles =
  'w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] text-[var(--color-text)] text-sm focus:border-[var(--color-primary)] focus:outline-none transition-colors'

const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  ({ className, error, variant = 'default', ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          baseInputStyles,
          variant === 'search' && 'py-1.5 pl-8',
          error && 'border-[var(--color-danger)]',
          className,
        )}
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
  children: React.ReactNode
}

const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  ({ className, label, error, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn(className)} {...props}>
        {label && <FormLabel>{label}</FormLabel>}
        {children}
        {error && <p className="text-xs text-[var(--color-danger)] mt-1">{error}</p>}
      </div>
    )
  },
)
FormField.displayName = 'FormField'

export { FormLabel, FormInput, FormSelect, FormTextarea, FormField }
