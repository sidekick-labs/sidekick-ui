import type { Meta, StoryObj } from '@storybook/react'
import { Search } from 'lucide-react'
import { FormField, FormInput, FormSelect, FormTextarea, FormLabel } from './form-field'

const meta: Meta<typeof FormField> = {
  title: 'UI/FormField',
  component: FormField,
  parameters: { layout: 'padded' },
}

export default meta
type Story = StoryObj<typeof FormField>

export const Default: Story = {
  render: () => (
    <div className="w-80">
      <FormField label="Email" inputId="email">
        <FormInput id="email" type="email" placeholder="you@example.com" />
      </FormField>
    </div>
  ),
}

export const WithError: Story = {
  render: () => (
    <div className="w-80">
      <FormField label="Email" inputId="email-err" error="Email is required">
        <FormInput
          id="email-err"
          type="email"
          aria-describedby="email-err-error"
          error="Email is required"
        />
      </FormField>
    </div>
  ),
}

export const WithIcon: Story = {
  render: () => (
    <div className="w-80">
      <FormField label="Search" inputId="search">
        <FormInput id="search" icon={Search} placeholder="Search devices..." />
      </FormField>
    </div>
  ),
}

export const Select: Story = {
  render: () => (
    <div className="w-80">
      <FormField label="Status" inputId="status">
        <FormSelect
          id="status"
          placeholder="Select a status"
          options={[
            { label: 'Active', value: 'active' },
            { label: 'Inactive', value: 'inactive' },
            { label: 'Archived', value: 'archived' },
          ]}
        />
      </FormField>
    </div>
  ),
}

export const Textarea: Story = {
  render: () => (
    <div className="w-80">
      <FormField label="Notes" inputId="notes">
        <FormTextarea id="notes" placeholder="Add any extra context..." rows={4} />
      </FormField>
    </div>
  ),
}

export const Disabled: Story = {
  render: () => (
    <div className="w-80">
      <FormField label="API Key" inputId="api-key">
        <FormInput id="api-key" disabled defaultValue="sk-disabled-readonly-value" />
      </FormField>
    </div>
  ),
}

export const StandaloneLabel: Story = {
  render: () => (
    <div className="w-80 flex flex-col gap-2">
      <FormLabel htmlFor="standalone">Standalone label</FormLabel>
      <FormInput id="standalone" placeholder="Without a wrapping FormField" />
    </div>
  ),
}
