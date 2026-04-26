import type { Meta, StoryObj } from '@storybook/react'
import { Checkbox } from './checkbox'

const meta: Meta<typeof Checkbox> = {
  title: 'UI/Checkbox',
  component: Checkbox,
  argTypes: {
    disabled: { control: 'boolean' },
    checked: { control: 'boolean' },
  },
}

export default meta
type Story = StoryObj<typeof Checkbox>

export const Default: Story = {
  args: {},
}

export const Checked: Story = {
  args: {
    defaultChecked: true,
  },
}

export const Disabled: Story = {
  args: {
    disabled: true,
  },
}

export const DisabledChecked: Story = {
  args: {
    disabled: true,
    defaultChecked: true,
  },
}

export const WithLabel: Story = {
  render: () => (
    <label htmlFor="terms" className="flex items-center gap-2 text-sm text-[var(--color-text)]">
      <Checkbox id="terms" defaultChecked />
      <span>Accept terms and conditions</span>
    </label>
  ),
}

export const States: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <label
        htmlFor="cb-unchecked"
        className="flex items-center gap-2 text-sm text-[var(--color-text)]"
      >
        <Checkbox id="cb-unchecked" /> Unchecked
      </label>
      <label
        htmlFor="cb-checked"
        className="flex items-center gap-2 text-sm text-[var(--color-text)]"
      >
        <Checkbox id="cb-checked" defaultChecked /> Checked
      </label>
      <label
        htmlFor="cb-disabled"
        className="flex items-center gap-2 text-sm text-[var(--color-text)]"
      >
        <Checkbox id="cb-disabled" disabled /> Disabled
      </label>
      <label
        htmlFor="cb-disabled-checked"
        className="flex items-center gap-2 text-sm text-[var(--color-text)]"
      >
        <Checkbox id="cb-disabled-checked" disabled defaultChecked /> Disabled + Checked
      </label>
    </div>
  ),
}
