import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { axe } from 'vitest-axe'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

describe('Popover (a11y)', () => {
  it('has no axe violations when closed (trigger only)', async () => {
    const { container } = render(
      <Popover>
        <PopoverTrigger>Open</PopoverTrigger>
      </Popover>,
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('has no axe violations when open with content', async () => {
    const { baseElement } = render(
      <Popover open>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent aria-label="Helpful text">
          <p>Some helpful text inside the popover.</p>
        </PopoverContent>
      </Popover>,
    )
    // Disable `region` — content is portaled so axe sees an unwrapped fragment.
    const results = await axe(baseElement, { rules: { region: { enabled: false } } })
    expect(results).toHaveNoViolations()
  })
})
