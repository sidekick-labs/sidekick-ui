import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup, within } from '@testing-library/react'
import { createRef } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs'

afterEach(cleanup)

describe('Tabs', () => {
  it('renders a complete tabs setup', () => {
    const { container } = render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>,
    )
    expect(within(container).getByText('Tab 1')).toBeInTheDocument()
    expect(within(container).getByText('Tab 2')).toBeInTheDocument()
    expect(within(container).getByText('Content 1')).toBeInTheDocument()
  })
})

describe('TabsList', () => {
  it('applies border-b styling', () => {
    const { container } = render(
      <Tabs defaultValue="t1">
        <TabsList>
          <TabsTrigger value="t1">T</TabsTrigger>
        </TabsList>
      </Tabs>,
    )
    const list = container.querySelector('[role="tablist"]')!
    expect(list.className).toContain('border-b')
  })

  it('forwards ref', () => {
    const ref = createRef<HTMLDivElement>()
    render(
      <Tabs defaultValue="t1">
        <TabsList ref={ref}>
          <TabsTrigger value="t1">T</TabsTrigger>
        </TabsList>
      </Tabs>,
    )
    expect(ref.current).toBeInstanceOf(HTMLDivElement)
  })

  it('merges custom className', () => {
    const { container } = render(
      <Tabs defaultValue="t1">
        <TabsList className="custom-class">
          <TabsTrigger value="t1">T</TabsTrigger>
        </TabsList>
      </Tabs>,
    )
    expect(container.querySelector('[role="tablist"]')).toHaveClass('custom-class')
  })
})

describe('TabsTrigger', () => {
  it('renders as a button with tab role', () => {
    const { container } = render(
      <Tabs defaultValue="t1">
        <TabsList>
          <TabsTrigger value="t1">Trigger</TabsTrigger>
        </TabsList>
      </Tabs>,
    )
    const trigger = within(container).getByRole('tab')
    expect(trigger).toHaveTextContent('Trigger')
  })

  it('applies trigger styling', () => {
    const { container } = render(
      <Tabs defaultValue="t1">
        <TabsList>
          <TabsTrigger value="t1">Trigger</TabsTrigger>
        </TabsList>
      </Tabs>,
    )
    const trigger = within(container).getByRole('tab')
    expect(trigger.className).toContain('cursor-pointer')
    expect(trigger.className).toContain('font-semibold')
  })

  it('forwards ref', () => {
    const ref = createRef<HTMLButtonElement>()
    render(
      <Tabs defaultValue="t1">
        <TabsList>
          <TabsTrigger ref={ref} value="t1">
            T
          </TabsTrigger>
        </TabsList>
      </Tabs>,
    )
    expect(ref.current).toBeInstanceOf(HTMLButtonElement)
  })

  it('merges custom className', () => {
    const { container } = render(
      <Tabs defaultValue="t1">
        <TabsList>
          <TabsTrigger className="custom-class" value="t1">
            T
          </TabsTrigger>
        </TabsList>
      </Tabs>,
    )
    expect(within(container).getByRole('tab')).toHaveClass('custom-class')
  })
})

describe('TabsContent', () => {
  it('renders content for the active tab', () => {
    const { container } = render(
      <Tabs defaultValue="t1">
        <TabsList>
          <TabsTrigger value="t1">T1</TabsTrigger>
        </TabsList>
        <TabsContent value="t1">Active content</TabsContent>
      </Tabs>,
    )
    expect(within(container).getByText('Active content')).toBeInTheDocument()
  })

  it('applies pt-4 styling', () => {
    const { container } = render(
      <Tabs defaultValue="t1">
        <TabsList>
          <TabsTrigger value="t1">T1</TabsTrigger>
        </TabsList>
        <TabsContent value="t1">Content</TabsContent>
      </Tabs>,
    )
    const panel = within(container).getByRole('tabpanel')
    expect(panel.className).toContain('pt-4')
  })

  it('forwards ref', () => {
    const ref = createRef<HTMLDivElement>()
    render(
      <Tabs defaultValue="t1">
        <TabsList>
          <TabsTrigger value="t1">T1</TabsTrigger>
        </TabsList>
        <TabsContent ref={ref} value="t1">
          Content
        </TabsContent>
      </Tabs>,
    )
    expect(ref.current).toBeInstanceOf(HTMLDivElement)
  })

  it('merges custom className', () => {
    const { container } = render(
      <Tabs defaultValue="t1">
        <TabsList>
          <TabsTrigger value="t1">T1</TabsTrigger>
        </TabsList>
        <TabsContent className="custom-class" value="t1">
          Content
        </TabsContent>
      </Tabs>,
    )
    expect(within(container).getByRole('tabpanel')).toHaveClass('custom-class')
  })
})
