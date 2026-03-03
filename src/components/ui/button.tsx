import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cn } from '@/lib/utils'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | 'primary'
    | 'secondary'
    | 'accent'
    | 'info'
    | 'success'
    | 'danger'
    | 'ghost'
    | 'muted'
    | 'outline'
    | 'link'
  size?: 'sm' | 'md' | 'lg' | 'auto'
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'

    const baseStyles =
      'inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] font-medium uppercase transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border-2'

    const variants = {
      primary:
        'bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:bg-[var(--color-primary-hover)] border-black/20',
      secondary:
        'bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)] hover:bg-[var(--color-secondary-hover)] border-black/20',
      accent:
        'bg-[var(--color-accent)] text-[var(--color-accent-foreground)] hover:bg-[var(--color-accent-hover)] border-black/30',
      info: 'bg-[var(--color-info)] text-[var(--color-info-foreground)] hover:bg-[var(--color-info-hover)] border-black/20',
      success:
        'bg-[var(--color-success)] text-[var(--color-success-foreground)] hover:bg-[var(--color-success-hover)] border-black/20',
      danger:
        'bg-[var(--color-danger)] text-[var(--color-danger-foreground)] hover:bg-[var(--color-danger-hover)] border-black/20',
      ghost:
        'hover:bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] border-[var(--color-border)]',
      muted:
        'bg-[var(--color-muted)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted-hover)] border-[var(--color-border)]',
      outline:
        'border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-[var(--color-primary-foreground)]',
      link: 'bg-transparent border-transparent text-[var(--color-text)] hover:text-[var(--color-primary)]',
    }

    const sizes = {
      sm: 'h-8 px-3 text-sm',
      md: 'h-10 px-4 text-sm',
      lg: 'h-12 px-6 text-base',
      auto: '',
    }

    return (
      <Comp
        type={asChild ? undefined : 'button'}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        ref={ref}
        {...props}
      />
    )
  },
)

Button.displayName = 'Button'

export { Button }
