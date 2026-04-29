import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { axe } from 'vitest-axe'
import { JsonEditor } from '@/components/ui/json-editor'

describe('JsonEditor (a11y)', () => {
  it('has no axe violations with valid JSON and a label', async () => {
    const { container } = render(
      <JsonEditor label="Configuration" value='{"key":"value"}' onChange={() => {}} />,
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('has no axe violations when disabled', async () => {
    const { container } = render(
      <JsonEditor label="Configuration" value="{}" onChange={() => {}} disabled />,
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('has no axe violations when external errors are shown', async () => {
    const { container } = render(
      <JsonEditor
        label="Configuration"
        value="{}"
        onChange={() => {}}
        errors={['Field "name" is required']}
      />,
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
