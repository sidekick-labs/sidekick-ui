import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { JsonEditor } from './json-editor'

const meta: Meta<typeof JsonEditor> = {
  title: 'UI/JsonEditor',
  component: JsonEditor,
  parameters: { layout: 'padded' },
}

export default meta
type Story = StoryObj<typeof JsonEditor>

const validJson = `{
  "name": "sidekick-glasses",
  "version": "0.1.0",
  "features": ["chat", "vision", "translate"],
  "active": true
}`

const invalidJson = `{
  "name": "broken",
  "missing_quote: true,
}`

function Wrapper({
  initial,
  ...rest
}: {
  initial: string
} & Omit<React.ComponentProps<typeof JsonEditor>, 'value' | 'onChange'>) {
  // Lazy initializer: `initial` seeds the controlled state once; later edits live in state.
  const [value, setValue] = React.useState(() => initial)
  return (
    <div className="w-[520px]">
      <JsonEditor value={value} onChange={setValue} {...rest} />
    </div>
  )
}

export const Default: Story = {
  render: () => <Wrapper initial={validJson} label="Configuration" />,
}

export const Empty: Story = {
  render: () => <Wrapper initial="" label="Configuration" placeholder="Paste JSON here..." />,
}

export const InvalidJson: Story = {
  render: () => <Wrapper initial={invalidJson} label="Configuration" />,
}

export const WithSchemaHints: Story = {
  render: () => (
    <Wrapper
      initial={validJson}
      label="Manifest"
      helperText="Validate against the manifest schema."
      schemaHints={[
        { name: 'name', type: 'string', description: 'Package identifier', required: true },
        { name: 'version', type: 'string', description: 'Semver version', required: true },
        { name: 'features', type: 'string[]', description: 'Enabled features' },
        { name: 'active', type: 'boolean' },
      ]}
    />
  ),
}

export const WithSubmitErrors: Story = {
  render: () => (
    <Wrapper
      initial={validJson}
      label="Configuration"
      errors={['version must be greater than 0.0.1', 'features must include "chat"']}
    />
  ),
}

export const Disabled: Story = {
  render: () => <Wrapper initial={validJson} label="Read-only" disabled />,
}
