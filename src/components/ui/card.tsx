import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cn } from '@/lib/utils'

export type CardProps = React.HTMLAttributes<HTMLDivElement>

const Card = React.forwardRef<HTMLDivElement, CardProps>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)]',
        className,
      )}
      {...props}
    />
  )
})
Card.displayName = 'Card'

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { padding?: 'sm' | 'md' | 'lg' }
>(({ className, padding = 'md', ...props }, ref) => {
  const paddings = {
    sm: 'p-3',
    md: 'p-4 pb-2',
    lg: 'p-6',
  }

  return (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-1.5', paddings[padding], className)}
      {...props}
    />
  )
})
CardHeader.displayName = 'CardHeader'

export type CardTitleProps = React.HTMLAttributes<HTMLHeadingElement> & {
  /** Render as child element instead of h3. Use to control heading level: `<CardTitle asChild><h2>…</h2></CardTitle>` */
  asChild?: boolean
}

const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'h3'
    return (
      <Comp
        ref={ref}
        className={cn(
          'text-lg font-semibold leading-none tracking-tight text-[var(--color-text)]',
          className,
        )}
        {...props}
      />
    )
  },
)
CardTitle.displayName = 'CardTitle'

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('text-sm text-[var(--color-text-muted)]', className)} {...props} />
))
CardDescription.displayName = 'CardDescription'

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { padding?: 'sm' | 'md' | 'lg' }
>(({ className, padding = 'md', ...props }, ref) => {
  const paddings = {
    sm: 'p-3',
    md: 'p-4 pt-2',
    lg: 'p-6',
  }

  return <div ref={ref} className={cn(paddings[padding], className)} {...props} />
})
CardContent.displayName = 'CardContent'

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { padding?: 'sm' | 'md' | 'lg' }
>(({ className, padding = 'md', ...props }, ref) => {
  const paddings = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  }

  return (
    <div ref={ref} className={cn('flex items-center', paddings[padding], className)} {...props} />
  )
})
CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
