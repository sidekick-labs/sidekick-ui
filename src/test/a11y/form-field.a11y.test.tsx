import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { axe } from 'vitest-axe'
import { FormField, FormInput, FormSelect, FormTextarea } from '@/components/ui/form-field'

describe('FormField (a11y)', () => {
  it('has no axe violations for a labelled input', async () => {
    const { container } = render(
      <FormField label="Email" inputId="email">
        <FormInput id="email" type="email" />
      </FormField>,
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('has no axe violations when an error is shown', async () => {
    const { container } = render(
      <FormField label="Email" inputId="email" error="Email is required">
        <FormInput id="email" type="email" aria-describedby="email-error" />
      </FormField>,
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('has no axe violations for a labelled select', async () => {
    const { container } = render(
      <FormField label="Role" inputId="role">
        <FormSelect
          id="role"
          options={[
            { label: 'Admin', value: 'admin' },
            { label: 'Member', value: 'member' },
          ]}
        />
      </FormField>,
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('has no axe violations for a labelled textarea', async () => {
    const { container } = render(
      <FormField label="Bio" inputId="bio">
        <FormTextarea id="bio" />
      </FormField>,
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
