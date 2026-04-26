import type { Meta, StoryObj } from '@storybook/react'
import { fn } from 'storybook/test'
import { Sparkles, Globe, Layers } from 'lucide-react'
import { PlatformSwitcher } from './platform-switcher'

const meta: Meta<typeof PlatformSwitcher> = {
  title: 'UI/PlatformSwitcher',
  component: PlatformSwitcher,
}

export default meta
type Story = StoryObj<typeof PlatformSwitcher>

const linkedApps = [
  { name: 'Sidekick Web', icon: <Globe className="h-4 w-4" />, href: 'https://example.com/web' },
  {
    name: 'Sidekick Harness',
    icon: <Layers className="h-4 w-4" />,
    href: 'https://example.com/harness',
  },
]

const organisations = [
  { id: 'org-1', name: 'Acme Robotics' },
  { id: 'org-2', name: 'Sidekick Labs' },
  { id: 'org-3', name: 'Personal' },
]

export const Default: Story = {
  args: {
    icon: <Sparkles className="h-5 w-5" />,
    label: 'Sidekick',
    linkedApps,
    organisations,
    activeOrganisationId: 'org-2',
    onSwitchOrganisation: fn(),
  },
}

export const NonInteractive: Story = {
  args: {
    icon: <Sparkles className="h-5 w-5" />,
    label: 'Sidekick',
    interactive: false,
  },
}

export const AppsOnly: Story = {
  args: {
    icon: <Sparkles className="h-5 w-5" />,
    label: 'Sidekick',
    linkedApps,
  },
}

export const OrganisationsOnly: Story = {
  args: {
    icon: <Sparkles className="h-5 w-5" />,
    label: 'Sidekick',
    organisations,
    activeOrganisationId: 'org-1',
    onSwitchOrganisation: fn(),
  },
}
