import * as React from 'react'
import { cn } from '@/lib/utils'

export interface BlockquoteProps extends React.HTMLAttributes<HTMLQuoteElement> {
  author?: string
  source?: string
}

const Blockquote = React.forwardRef<HTMLQuoteElement, BlockquoteProps>(
  ({ className, children, author, source, ...props }, ref) => (
    <blockquote
      ref={ref}
      className={cn(
        'border-l-4 border-[var(--color-primary)] pl-6 italic text-[var(--color-text-secondary)]',
        className,
      )}
      {...props}
    >
      {children}
      {(author || source) && (
        <footer className="mt-2 text-sm text-[var(--color-text-muted)] not-italic">
          {author && <cite className="font-medium text-[var(--color-text)]">{author}</cite>}
          {author && source && ' - '}
          {source && <span>{source}</span>}
        </footer>
      )}
    </blockquote>
  ),
)
Blockquote.displayName = 'Blockquote'

export { Blockquote }
