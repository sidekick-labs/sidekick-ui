import * as React from 'react'
import { Check, ChevronDown, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './dropdown-menu'
import { Avatar, AvatarFallback } from './avatar'

export interface LinkedApp {
  name: string
  icon: React.ReactNode
  href: string
}

export interface Organisation {
  id: string
  name: string
}

export interface PlatformSwitcherProps {
  /** App brand icon (ReactNode, e.g. an SVG or lucide icon) */
  icon: React.ReactNode
  /** App name — used for tooltip / sr-only label */
  label: string
  /** Cross-app navigation links (e.g. Sidekick Web ↔ Harness) */
  linkedApps?: LinkedApp[]
  /** Organisations the user can switch between */
  organisations?: Organisation[]
  /** Currently active organisation ID — shows check mark */
  activeOrganisationId?: string
  /** Callback when an organisation is selected */
  onSwitchOrganisation?: (id: string) => void
  /** When false, renders a static icon with no dropdown (default: true) */
  interactive?: boolean
}

function PlatformSwitcher({
  icon,
  label,
  linkedApps,
  organisations,
  activeOrganisationId,
  onSwitchOrganisation,
  interactive = true,
}: PlatformSwitcherProps) {
  const iconBox = (
    <div
      className={cn(
        'relative flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-primary)] text-white',
        interactive && 'cursor-pointer',
      )}
    >
      {icon}
      <span className="sr-only">{label}</span>
      {interactive && <ChevronDown className="absolute bottom-0.5 right-0.5 h-3 w-3 opacity-60" />}
    </div>
  )

  if (!interactive) {
    return iconBox
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className="focus-visible:outline-none">
          {iconBox}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="right" align="start" className="w-52">
        {linkedApps && linkedApps.length > 0 && (
          <>
            <DropdownMenuLabel>Apps</DropdownMenuLabel>
            {linkedApps.map((app) => (
              <DropdownMenuItem key={app.href} asChild>
                <a
                  href={app.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                    {app.icon}
                  </span>
                  <span className="flex-1">{app.name}</span>
                  <ExternalLink className="h-3.5 w-3.5 opacity-40" />
                </a>
              </DropdownMenuItem>
            ))}
          </>
        )}

        {linkedApps && linkedApps.length > 0 && organisations && organisations.length > 0 && (
          <DropdownMenuSeparator />
        )}

        {organisations && organisations.length > 0 && (
          <>
            <DropdownMenuLabel>Organisations</DropdownMenuLabel>
            {organisations.map((org) => (
              <DropdownMenuItem
                key={org.id}
                className="flex items-center gap-2"
                onSelect={() => onSwitchOrganisation?.(org.id)}
              >
                <Avatar className="h-6 w-6 rounded-md">
                  <AvatarFallback className="rounded-md bg-[var(--color-muted)] text-xs text-[var(--color-text)]">
                    {org.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="flex-1">{org.name}</span>
                {org.id === activeOrganisationId && <Check className="h-4 w-4 opacity-60" />}
              </DropdownMenuItem>
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { PlatformSwitcher }
