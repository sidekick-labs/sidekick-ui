import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { axe } from 'vitest-axe'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

describe('Dialog (a11y)', () => {
  it('has no axe violations when closed (trigger only)', async () => {
    const { container } = render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
      </Dialog>,
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('has no axe violations when open with title and description', async () => {
    // No `region` rule suppression here (unlike DropdownMenu/Tooltip): Dialog
    // content renders inside an element with role="dialog", which itself is a
    // landmark satisfying axe's region rule. The portaled DropdownMenu and
    // Tooltip primitives have no landmark wrapper, so they need the suppression.
    const { baseElement } = render(
      <Dialog open>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm action</DialogTitle>
            <DialogDescription>Are you sure?</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>,
    )
    const results = await axe(baseElement)
    expect(results).toHaveNoViolations()
  })
})
