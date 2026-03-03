import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup, within } from '@testing-library/react'
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from './breadcrumb'

afterEach(cleanup)

describe('Breadcrumb', () => {
  it('renders a nav with breadcrumb aria-label', () => {
    const { container } = render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>,
    )
    const nav = container.querySelector('nav')
    expect(nav).toBeInTheDocument()
    expect(nav).toHaveAttribute('aria-label', 'breadcrumb')
  })

  it('renders links and current page', () => {
    const { container } = render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Settings</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>,
    )
    const view = within(container)
    const link = view.getByText('Home')
    expect(link.tagName).toBe('A')
    expect(link).toHaveAttribute('href', '/')

    const page = view.getByText('Settings')
    expect(page).toHaveAttribute('aria-current', 'page')
  })

  it('renders BreadcrumbLink as child element when asChild is true', () => {
    const { container } = render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <button type="button">Custom</button>
            </BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>,
    )
    const btn = within(container).getByText('Custom')
    expect(btn.tagName).toBe('BUTTON')
    // Should not render an <a> element
    expect(container.querySelector('a')).toBeNull()
  })

  it('renders separator with default chevron icon', () => {
    const { container } = render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Page</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>,
    )
    const separator = container.querySelector('[aria-hidden="true"]')
    expect(separator).toBeInTheDocument()
    expect(separator?.querySelector('svg')).toBeInTheDocument()
  })
})
