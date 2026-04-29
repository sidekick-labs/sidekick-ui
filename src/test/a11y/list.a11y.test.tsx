import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { axe } from 'vitest-axe'
import {
  List,
  ListItem,
  ListItemDescription,
  ListItemTitle,
  ListSection,
} from '@/components/ui/list'

describe('List (a11y)', () => {
  it('has no axe violations for a basic list with items', async () => {
    const { container } = render(
      <List>
        <ListItem>
          <ListItemTitle>First item</ListItemTitle>
          <ListItemDescription>Some details</ListItemDescription>
        </ListItem>
        <ListItem>
          <ListItemTitle>Second item</ListItemTitle>
        </ListItem>
      </List>,
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('has no axe violations with a collapsible section', async () => {
    const { container } = render(
      <List>
        <ListSection collapsible title="More options">
          <ListItem>
            <ListItemTitle>Hidden item</ListItemTitle>
          </ListItem>
        </ListSection>
      </List>,
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
