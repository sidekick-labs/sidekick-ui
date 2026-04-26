import type { Meta, StoryObj } from '@storybook/react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './card'
import { Button } from './button'

const meta: Meta<typeof Card> = {
  title: 'UI/Card',
  component: Card,
  parameters: { layout: 'padded' },
}

export default meta
type Story = StoryObj<typeof Card>

export const Default: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Card title</CardTitle>
        <CardDescription>Short summary of the card contents.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-[var(--color-text-secondary)]">
          The card body holds the main content. Use it for grouped information.
        </p>
      </CardContent>
    </Card>
  ),
}

export const WithFooter: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Project settings</CardTitle>
        <CardDescription>Update your project preferences below.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Changes are saved when you click the button.
        </p>
      </CardContent>
      <CardFooter className="justify-end gap-2">
        <Button variant="ghost">Cancel</Button>
        <Button>Save</Button>
      </CardFooter>
    </Card>
  ),
}

export const ContentOnly: Story = {
  render: () => (
    <Card className="w-80">
      <CardContent>
        <p className="text-sm text-[var(--color-text)]">
          A card without a header — useful for simple content panels.
        </p>
      </CardContent>
    </Card>
  ),
}

export const PaddingVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Card className="w-80">
        <CardHeader padding="sm">
          <CardTitle>Small padding</CardTitle>
        </CardHeader>
        <CardContent padding="sm">Tight content.</CardContent>
      </Card>
      <Card className="w-80">
        <CardHeader padding="md">
          <CardTitle>Medium padding</CardTitle>
        </CardHeader>
        <CardContent padding="md">Default content density.</CardContent>
      </Card>
      <Card className="w-80">
        <CardHeader padding="lg">
          <CardTitle>Large padding</CardTitle>
        </CardHeader>
        <CardContent padding="lg">Roomy content.</CardContent>
      </Card>
    </div>
  ),
}
