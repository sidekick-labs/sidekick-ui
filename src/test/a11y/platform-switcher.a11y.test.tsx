import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { axe } from 'vitest-axe'
import { Sparkles } from 'lucide-react'
import { PlatformSwitcher } from '@/components/ui/platform-switcher'

describe('PlatformSwitcher (a11y)', () => {
  it('has no axe violations as a static (non-interactive) icon', async () => {
    const { container } = render(
      <PlatformSwitcher icon={<Sparkles />} label="Sidekick" interactive={false} />,
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('has no axe violations as an interactive trigger (closed)', async () => {
    const { container } = render(
      <PlatformSwitcher
        icon={<Sparkles />}
        label="Sidekick"
        linkedApps={[
          {
            name: 'Sidekick Web',
            icon: <Sparkles />,
            href: 'https://example.com',
          },
        ]}
        organisations={[
          { id: 'org-1', name: 'Acme Inc.' },
          { id: 'org-2', name: 'Globex' },
        ]}
        activeOrganisationId="org-1"
      />,
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
