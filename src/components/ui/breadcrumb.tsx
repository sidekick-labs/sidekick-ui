import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const Breadcrumb = React.forwardRef<HTMLElement, React.ComponentPropsWithoutRef<'nav'>>(
  ({ className, ...props }, ref) => (
    <nav
      ref={ref}
      aria-label="breadcrumb"
      className={cn('flex items-center text-sm text-[var(--color-text-muted)]', className)}
      {...props}
    />
  ),
)
Breadcrumb.displayName = 'Breadcrumb'

const BreadcrumbList = React.forwardRef<HTMLOListElement, React.ComponentPropsWithoutRef<'ol'>>(
  ({ className, ...props }, ref) => (
    <ol ref={ref} className={cn('flex items-center gap-2', className)} {...props} />
  ),
)
BreadcrumbList.displayName = 'BreadcrumbList'

const BreadcrumbItem = React.forwardRef<HTMLLIElement, React.ComponentPropsWithoutRef<'li'>>(
  ({ className, ...props }, ref) => (
    <li ref={ref} className={cn('flex items-center gap-2', className)} {...props} />
  ),
)
BreadcrumbItem.displayName = 'BreadcrumbItem'

export type BreadcrumbLinkProps = React.ComponentPropsWithoutRef<'a'> & {
  asChild?: boolean
}

const BreadcrumbLink = React.forwardRef<HTMLAnchorElement, BreadcrumbLinkProps>(
  ({ className, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'a'
    return (
      <Comp
        ref={ref}
        className={cn('transition-colors hover:text-[var(--color-text)]', className)}
        {...props}
      />
    )
  },
)
BreadcrumbLink.displayName = 'BreadcrumbLink'

const BreadcrumbPage = React.forwardRef<HTMLSpanElement, React.ComponentPropsWithoutRef<'span'>>(
  ({ className, ...props }, ref) => (
    <span
      ref={ref}
      aria-current="page"
      className={cn('font-medium text-[var(--color-text)]', className)}
      {...props}
    />
  ),
)
BreadcrumbPage.displayName = 'BreadcrumbPage'

const BreadcrumbSeparator = ({
  children,
  className,
  ...props
}: React.ComponentPropsWithoutRef<'li'>) => (
  <li
    role="presentation"
    aria-hidden="true"
    className={cn('[&>svg]:size-3.5', className)}
    {...props}
  >
    {children ?? <ChevronRight />}
  </li>
)
BreadcrumbSeparator.displayName = 'BreadcrumbSeparator'

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
}
