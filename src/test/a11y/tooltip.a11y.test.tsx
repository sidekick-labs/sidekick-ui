import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { axe } from 'vitest-axe'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip'

describe('Tooltip (a11y)', () => {
  it('has no axe violations with a button trigger', async () => {
    const { container } = render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent>Helpful hint</TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('has no axe violations when forced open', async () => {
    const { baseElement } = render(
      <TooltipProvider>
        <Tooltip open>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent>Helpful hint</TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    )
    // Disable `region` — content is portaled so axe sees an unwrapped fragment,
    // not a real page. The rule is meaningful at app level, not for component fragments.
    const results = await axe(baseElement, { rules: { region: { enabled: false } } })
    expect(results).toHaveNoViolations()
  })
})
