import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { axe } from 'vitest-axe'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

describe('Card (a11y)', () => {
  it('has no axe violations for an empty card', async () => {
    const { container } = render(<Card>Body content</Card>)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('has no axe violations with header, content, and footer', async () => {
    const { container } = render(
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Manage your account settings.</CardDescription>
        </CardHeader>
        <CardContent>Profile details go here.</CardContent>
        <CardFooter>Footer actions</CardFooter>
      </Card>,
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
