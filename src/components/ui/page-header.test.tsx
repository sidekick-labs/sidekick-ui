import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, fireEvent, cleanup, within } from '@testing-library/react'
import { PageHeader } from './page-header'

afterEach(cleanup)

describe('PageHeader', () => {
  it('renders title', () => {
    const { container } = render(<PageHeader title="Dashboard" />)
    expect(within(container).getByText('Dashboard')).toBeInTheDocument()
  })

  it('renders breadcrumbs', () => {
    const crumbs = [
      { label: 'Home', href: '/' },
      { label: 'Settings', href: '/settings' },
      { label: 'Profile' },
    ]
    const { container } = render(<PageHeader breadcrumbs={crumbs} />)
    const view = within(container)
    expect(view.getByText('Home')).toBeInTheDocument()
    expect(view.getByText('Settings')).toBeInTheDocument()
    expect(view.getByText('Profile')).toBeInTheDocument()
  })

  it('renders both title and breadcrumbs when both provided', () => {
    const crumbs = [{ label: 'Home', href: '/' }, { label: 'Current' }]
    const { container } = render(<PageHeader title="Page Title" breadcrumbs={crumbs} />)
    const view = within(container)
    expect(view.getByText('Page Title')).toBeInTheDocument()
    expect(view.getByText('Home')).toBeInTheDocument()
    expect(view.getByText('Current')).toBeInTheDocument()
  })

  it('renders back button only when both showBackButton and onBackClick provided', () => {
    const onClick = vi.fn()
    const { container } = render(<PageHeader title="Page" showBackButton onBackClick={onClick} />)
    const backBtn = within(container).getByText('Back')
    expect(backBtn).toBeInTheDocument()
    fireEvent.click(backBtn)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('does not render back button when showBackButton is true but onBackClick is missing', () => {
    const { container } = render(<PageHeader title="Page" showBackButton />)
    expect(within(container).queryByText('Back')).toBeNull()
  })

  it('renders actions', () => {
    const { container } = render(<PageHeader title="Page" actions={<button>Save</button>} />)
    expect(within(container).getByText('Save')).toBeInTheDocument()
  })

  it('renders children', () => {
    const { container } = render(
      <PageHeader title="Page">
        <span>Extra content</span>
      </PageHeader>,
    )
    expect(within(container).getByText('Extra content')).toBeInTheDocument()
  })
})
