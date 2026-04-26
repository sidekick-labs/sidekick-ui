import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, fireEvent, cleanup, screen } from '@testing-library/react'
import { PlatformSwitcher, type LinkedApp, type Organisation } from './platform-switcher'

// @testing-library/react's auto-cleanup only fires when Vitest's `globals`
// option is enabled. This config keeps Vitest non-global, so an explicit
// afterEach(cleanup) is required to unmount between tests.
afterEach(cleanup)

const Icon = () => <span data-testid="brand-icon">B</span>

const linkedApps: LinkedApp[] = [
  { name: 'Sidekick Web', icon: <span data-testid="app-icon-web" />, href: 'https://web.example' },
  {
    name: 'Sidekick Harness',
    icon: <span data-testid="app-icon-harness" />,
    href: 'https://harness.example',
  },
]

const organisations: Organisation[] = [
  { id: 'org-1', name: 'Acme' },
  { id: 'org-2', name: 'Beta Corp' },
]

describe('PlatformSwitcher', () => {
  it('renders the brand icon and sr-only label', () => {
    render(<PlatformSwitcher icon={<Icon />} label="Sidekick" />)
    expect(screen.getByTestId('brand-icon')).toBeInTheDocument()
    expect(screen.getByText('Sidekick')).toHaveClass('sr-only')
  })

  it('renders chevron when interactive (default)', () => {
    const { container } = render(<PlatformSwitcher icon={<Icon />} label="Sidekick" />)
    // Lucide icons render as <svg> with a class identifying the icon — assert
    // the chevron specifically so this fails if the chevron is removed.
    expect(container.querySelector('svg.lucide-chevron-down')).toBeInTheDocument()
    // Trigger button rendered
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('renders as static (non-interactive) icon when interactive=false', () => {
    const { container } = render(
      <PlatformSwitcher icon={<Icon />} label="Sidekick" interactive={false} />,
    )
    // No button trigger
    expect(container.querySelector('button')).toBeNull()
    // No chevron
    expect(container.querySelector('svg')).toBeNull()
    // Brand icon still renders
    expect(screen.getByTestId('brand-icon')).toBeInTheDocument()
  })

  it('opens the menu and shows linked apps when triggered', () => {
    render(<PlatformSwitcher icon={<Icon />} label="Sidekick" linkedApps={linkedApps} />)
    // Radix DropdownMenu opens on pointerdown
    const trigger = screen.getByRole('button')
    fireEvent.pointerDown(trigger, { button: 0 })
    fireEvent.click(trigger)

    expect(screen.getByText('Apps')).toBeInTheDocument()
    expect(screen.getByText('Sidekick Web')).toBeInTheDocument()
    expect(screen.getByText('Sidekick Harness')).toBeInTheDocument()
  })

  it('renders linked app links with target="_blank" and rel attrs', () => {
    render(<PlatformSwitcher icon={<Icon />} label="Sidekick" linkedApps={linkedApps} />)
    const trigger = screen.getByRole('button')
    fireEvent.pointerDown(trigger, { button: 0 })
    fireEvent.click(trigger)

    const webLink = screen.getByText('Sidekick Web').closest('a')
    expect(webLink).toHaveAttribute('href', 'https://web.example')
    expect(webLink).toHaveAttribute('target', '_blank')
    expect(webLink).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('renders organisations when provided and marks the active one', () => {
    render(
      <PlatformSwitcher
        icon={<Icon />}
        label="Sidekick"
        organisations={organisations}
        activeOrganisationId="org-2"
      />,
    )
    const trigger = screen.getByRole('button')
    fireEvent.pointerDown(trigger, { button: 0 })
    fireEvent.click(trigger)

    expect(screen.getByText('Organisations')).toBeInTheDocument()
    expect(screen.getByText('Acme')).toBeInTheDocument()
    expect(screen.getByText('Beta Corp')).toBeInTheDocument()
    // Avatar fallbacks use first letter, uppercased — query the Avatar root
    // (rendered as a span by Radix) within each menu item so the assertion
    // doesn't trivially pass via the org name itself.
    const acmeItem = screen.getByText('Acme').closest('[role="menuitem"]') as HTMLElement
    const betaItem = screen.getByText('Beta Corp').closest('[role="menuitem"]') as HTMLElement
    expect(acmeItem).not.toBeNull()
    expect(betaItem).not.toBeNull()
    // The Avatar root is the first child of the menu item; its only descendant
    // text is the AvatarFallback's first-letter content.
    const acmeFallback = acmeItem.querySelector('[class*="rounded-md"][class*="h-6"]')
    const betaFallback = betaItem.querySelector('[class*="rounded-md"][class*="h-6"]')
    expect(acmeFallback?.textContent).toBe('A')
    expect(betaFallback?.textContent).toBe('B')
    // Active org has a check icon (lucide renders an svg with class lucide-check)
    expect(betaItem.querySelector('svg.lucide-check')).not.toBeNull()
    expect(acmeItem.querySelector('svg.lucide-check')).toBeNull()
  })

  it('invokes onSwitchOrganisation with the org id when one is selected', () => {
    const onSwitch = vi.fn()
    render(
      <PlatformSwitcher
        icon={<Icon />}
        label="Sidekick"
        organisations={organisations}
        activeOrganisationId="org-1"
        onSwitchOrganisation={onSwitch}
      />,
    )
    const trigger = screen.getByRole('button')
    fireEvent.pointerDown(trigger, { button: 0 })
    fireEvent.click(trigger)

    const item = screen.getByText('Beta Corp')
    fireEvent.click(item)

    expect(onSwitch).toHaveBeenCalledWith('org-2')
  })

  it('does not throw when onSwitchOrganisation is omitted', () => {
    render(
      <PlatformSwitcher
        icon={<Icon />}
        label="Sidekick"
        organisations={organisations}
        activeOrganisationId="org-1"
      />,
    )
    const trigger = screen.getByRole('button')
    fireEvent.pointerDown(trigger, { button: 0 })
    fireEvent.click(trigger)
    expect(() => fireEvent.click(screen.getByText('Beta Corp'))).not.toThrow()
  })

  it('renders a separator when both linkedApps and organisations are present', () => {
    render(
      <PlatformSwitcher
        icon={<Icon />}
        label="Sidekick"
        linkedApps={linkedApps}
        organisations={organisations}
      />,
    )
    const trigger = screen.getByRole('button')
    fireEvent.pointerDown(trigger, { button: 0 })
    fireEvent.click(trigger)

    expect(screen.getByRole('separator')).toBeInTheDocument()
  })

  it('does not render the Apps section when linkedApps is empty', () => {
    render(
      <PlatformSwitcher
        icon={<Icon />}
        label="Sidekick"
        linkedApps={[]}
        organisations={organisations}
      />,
    )
    const trigger = screen.getByRole('button')
    fireEvent.pointerDown(trigger, { button: 0 })
    fireEvent.click(trigger)

    expect(screen.queryByText('Apps')).not.toBeInTheDocument()
    expect(screen.getByText('Organisations')).toBeInTheDocument()
  })

  it('does not render the Organisations section when organisations is empty', () => {
    render(
      <PlatformSwitcher
        icon={<Icon />}
        label="Sidekick"
        linkedApps={linkedApps}
        organisations={[]}
      />,
    )
    const trigger = screen.getByRole('button')
    fireEvent.pointerDown(trigger, { button: 0 })
    fireEvent.click(trigger)

    expect(screen.queryByText('Organisations')).not.toBeInTheDocument()
    expect(screen.getByText('Apps')).toBeInTheDocument()
  })
})
