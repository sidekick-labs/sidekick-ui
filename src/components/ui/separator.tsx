import * as React from 'react'
import * as SeparatorPrimitive from '@radix-ui/react-separator'
import { cn } from '@/lib/utils'

export type SeparatorProps = React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root> & {
  dashed?: boolean
}

const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  SeparatorProps
>(({ className, orientation = 'horizontal', decorative = true, dashed = false, ...props }, ref) => (
  <SeparatorPrimitive.Root
    ref={ref}
    decorative={decorative}
    orientation={orientation}
    className={cn(
      'shrink-0 bg-[var(--color-border)]',
      dashed && 'border-dashed bg-transparent',
      orientation === 'horizontal' ? 'h-[1px] w-full' : 'h-full w-[1px]',
      dashed && orientation === 'horizontal' && 'border-t border-[var(--color-border)]',
      dashed && orientation === 'vertical' && 'border-l border-[var(--color-border)]',
      className,
    )}
    {...props}
  />
))
Separator.displayName = SeparatorPrimitive.Root.displayName

export { Separator }
