import * as React from 'react'
import { Bot, User, Monitor } from 'lucide-react'
import { cn } from '@/lib/utils'

// Omit 'content' because HTMLAttributes declares content?: string (global HTML attribute)
// and our content is ReactNode.
export interface ChatMessageProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'content'> {
  role: 'user' | 'assistant' | 'system'
  content: React.ReactNode
  timestamp?: string
  /** Show a streaming indicator. Only meaningful for role="assistant". */
  isStreaming?: boolean
}

const roleConfig = {
  user: {
    Icon: User,
    label: 'User',
    bubbleClass: 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]',
    avatarClass: 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]',
    alignment: 'justify-end',
  },
  assistant: {
    Icon: Bot,
    label: 'Assistant',
    bubbleClass: 'bg-[var(--color-muted)] text-[var(--color-text)]',
    avatarClass: 'bg-[var(--color-accent)] text-[var(--color-accent-foreground)]',
    alignment: 'justify-start',
  },
  system: {
    Icon: Monitor,
    label: 'System',
    bubbleClass:
      'bg-[var(--color-surface)] text-[var(--color-text-muted)] border border-dashed border-[var(--color-border)]',
    avatarClass: 'bg-[var(--color-muted)] text-[var(--color-text-muted)]',
    alignment: 'justify-start',
  },
} as const

const ChatMessage = React.forwardRef<HTMLDivElement, ChatMessageProps>(
  ({ role, content, timestamp, isStreaming = false, className, ...props }, ref) => {
    React.useEffect(() => {
      if (process.env.NODE_ENV !== 'production' && isStreaming && role !== 'assistant') {
        console.warn('ChatMessage: isStreaming is only meaningful for role="assistant"')
      }
    }, [isStreaming, role])

    const config = roleConfig[role]
    const { Icon } = config

    const avatar = (
      <div
        className={cn(
          'flex items-center justify-center w-8 h-8 rounded-full shrink-0',
          config.avatarClass,
        )}
        aria-hidden="true"
      >
        <Icon className="w-4 h-4" />
      </div>
    )

    return (
      <div
        ref={ref}
        role="group"
        aria-label={`${config.label} message`}
        className={cn('flex gap-3', config.alignment, className)}
        {...props}
      >
        {role !== 'user' && avatar}

        <div className="max-w-[80%] space-y-1">
          <div
            className={cn('rounded-lg px-4 py-2.5 text-sm', config.bubbleClass)}
            aria-live="polite"
            aria-busy={isStreaming}
          >
            <div className="whitespace-pre-wrap">{content}</div>
            {isStreaming && (
              <span
                className="inline-block w-1.5 h-4 ml-0.5 bg-current animate-pulse rounded-sm"
                aria-label="Streaming"
              />
            )}
          </div>
          {timestamp && <p className="text-xs text-[var(--color-text-muted)] px-1">{timestamp}</p>}
        </div>

        {role === 'user' && avatar}
      </div>
    )
  },
)
ChatMessage.displayName = 'ChatMessage'

export { ChatMessage }
