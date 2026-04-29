import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { axe } from 'vitest-axe'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

describe('Tabs (a11y)', () => {
  it('has no axe violations with default render', async () => {
    const { container } = render(
      <Tabs defaultValue="one">
        <TabsList>
          <TabsTrigger value="one">One</TabsTrigger>
          <TabsTrigger value="two">Two</TabsTrigger>
        </TabsList>
        <TabsContent value="one">Panel one content</TabsContent>
        <TabsContent value="two">Panel two content</TabsContent>
      </Tabs>,
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('has no axe violations with the second tab active', async () => {
    const { container } = render(
      <Tabs defaultValue="two">
        <TabsList>
          <TabsTrigger value="one">One</TabsTrigger>
          <TabsTrigger value="two">Two</TabsTrigger>
        </TabsList>
        <TabsContent value="one">Panel one content</TabsContent>
        <TabsContent value="two">Panel two content</TabsContent>
      </Tabs>,
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
