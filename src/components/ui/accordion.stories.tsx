import type { Meta, StoryObj } from '@storybook/react'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from './accordion'

const meta: Meta<typeof Accordion> = {
  title: 'UI/Accordion',
  component: Accordion,
}

export default meta
type Story = StoryObj<typeof Accordion>

export const Default: Story = {
  render: () => (
    <Accordion type="single" collapsible className="w-80">
      <AccordionItem value="item-1">
        <AccordionTrigger>Is it accessible?</AccordionTrigger>
        <AccordionContent>
          Yes. It adheres to the WAI-ARIA design pattern and includes keyboard navigation.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Is it styled?</AccordionTrigger>
        <AccordionContent>
          Yes. It comes with default styles that match the design system tokens.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>Is it animated?</AccordionTrigger>
        <AccordionContent>
          Yes. It includes open/close animations driven by CSS data attributes.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
}

export const DefaultOpen: Story = {
  render: () => (
    <Accordion type="single" collapsible defaultValue="item-1" className="w-80">
      <AccordionItem value="item-1">
        <AccordionTrigger>Section one (open by default)</AccordionTrigger>
        <AccordionContent>
          The first item is opened on mount via the `defaultValue` prop.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Section two</AccordionTrigger>
        <AccordionContent>This section starts collapsed.</AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
}

export const Multiple: Story = {
  render: () => (
    <Accordion type="multiple" defaultValue={['a', 'b']} className="w-80">
      <AccordionItem value="a">
        <AccordionTrigger>First</AccordionTrigger>
        <AccordionContent>Multiple sections can be open simultaneously.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="b">
        <AccordionTrigger>Second</AccordionTrigger>
        <AccordionContent>Useful for FAQ-style layouts.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="c">
        <AccordionTrigger>Third</AccordionTrigger>
        <AccordionContent>Click any trigger to toggle.</AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
}
