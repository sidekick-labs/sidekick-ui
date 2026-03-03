import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, fireEvent, cleanup } from '@testing-library/react'
import { within } from '@testing-library/react'
import { ListSection, ListItem } from './list'

afterEach(cleanup)

describe('ListSection', () => {
  it('renders children when collapsible and defaultOpen', () => {
    const { container } = render(
      <ListSection title="Section" collapsible defaultOpen>
        <div>Item 1</div>
      </ListSection>,
    )
    expect(within(container).getByText('Item 1')).toBeInTheDocument()
  })

  it('hides children when collapsible and defaultOpen is false', () => {
    const { container } = render(
      <ListSection title="Section" collapsible defaultOpen={false}>
        <div>Item 1</div>
      </ListSection>,
    )
    expect(within(container).queryByText('Item 1')).not.toBeInTheDocument()
  })

  it('toggles visibility on click', () => {
    const { container } = render(
      <ListSection title="Section" collapsible defaultOpen>
        <div>Item 1</div>
      </ListSection>,
    )
    const view = within(container)
    expect(view.getByText('Item 1')).toBeInTheDocument()

    fireEvent.click(view.getByRole('button'))
    expect(view.queryByText('Item 1')).not.toBeInTheDocument()

    fireEvent.click(view.getByRole('button'))
    expect(view.getByText('Item 1')).toBeInTheDocument()
  })

  it('sets aria-expanded on collapsible button', () => {
    const { container } = render(
      <ListSection title="Section" collapsible defaultOpen>
        <div>Item 1</div>
      </ListSection>,
    )
    const btn = within(container).getByRole('button')
    expect(btn).toHaveAttribute('aria-expanded', 'true')

    fireEvent.click(btn)
    expect(btn).toHaveAttribute('aria-expanded', 'false')
  })

  it('applies className when collapsible', () => {
    const { container } = render(
      <ListSection title="Section" collapsible className="custom-class">
        <div>Item 1</div>
      </ListSection>,
    )
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('applies className when non-collapsible', () => {
    const { container } = render(
      <ListSection title="Section" className="custom-class">
        <div>Item 1</div>
      </ListSection>,
    )
    expect(container.firstChild).toHaveClass('custom-class')
  })
})

describe('ListItem', () => {
  it('renders children', () => {
    const { container } = render(<ListItem>Content</ListItem>)
    expect(within(container).getByText('Content')).toBeInTheDocument()
  })

  it('renders prefix', () => {
    const { container } = render(<ListItem prefix="AB">Content</ListItem>)
    expect(within(container).getByText('AB')).toBeInTheDocument()
  })

  it('renders suffix', () => {
    const { container } = render(<ListItem suffix={<span>Extra</span>}>Content</ListItem>)
    expect(within(container).getByText('Extra')).toBeInTheDocument()
  })

  it('renders icon', () => {
    const { container } = render(<ListItem icon={<svg data-testid="icon" />}>Content</ListItem>)
    expect(container.querySelector('[data-testid="icon"]')).toBeInTheDocument()
  })

  it('applies active class', () => {
    const { container } = render(<ListItem active>Content</ListItem>)
    expect((container.firstChild as HTMLElement).className).toContain(
      'bg-[var(--color-surface-hover)]',
    )
  })

  it('renders action buttons with aria-label and fires onClick', () => {
    const onClick = vi.fn()
    const { container } = render(
      <ListItem
        actions={[
          {
            icon: <svg data-testid="action-icon" />,
            label: 'Edit',
            onClick,
          },
        ]}
      >
        Content
      </ListItem>,
    )
    const actionBtn = within(container).getByRole('button', { name: 'Edit' })
    expect(actionBtn).toBeInTheDocument()
    fireEvent.click(actionBtn)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('actions container has ml-auto', () => {
    const { container } = render(
      <ListItem actions={[{ icon: <svg />, label: 'Delete', onClick: () => {} }]}>
        Content
      </ListItem>,
    )
    const actionBtn = within(container).getByRole('button', { name: 'Delete' })
    const actionsContainer = actionBtn.parentElement as HTMLElement
    expect(actionsContainer.className).toContain('ml-auto')
  })

  it('merges custom className', () => {
    const { container } = render(<ListItem className="custom-class">Content</ListItem>)
    expect(container.firstChild).toHaveClass('custom-class')
  })
})
