import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, fireEvent, cleanup, within } from '@testing-library/react'
import { Pagination } from './pagination'
import { PaginationMetadata } from '@/types/pagination'

afterEach(cleanup)

const basePagination: PaginationMetadata = {
  page: 2,
  pages: 5,
  count: 50,
  limit: 10,
  from: 11,
  to: 20,
  previous: 1,
  next: 3,
}

describe('Pagination', () => {
  it('renders nothing when pages <= 1', () => {
    const { container } = render(
      <Pagination pagination={{ ...basePagination, pages: 1 }} onPageChange={() => {}} />,
    )
    expect(container.firstChild).toBeNull()
  })

  describe('full variant', () => {
    it('shows result range', () => {
      const { container } = render(
        <Pagination pagination={basePagination} onPageChange={() => {}} />,
      )
      const view = within(container)
      expect(view.getByText('11')).toBeInTheDocument()
      expect(view.getByText('20')).toBeInTheDocument()
      expect(view.getByText('50')).toBeInTheDocument()
    })

    it('calls onPageChange with previous page', () => {
      const onPageChange = vi.fn()
      const { container } = render(
        <Pagination pagination={basePagination} onPageChange={onPageChange} />,
      )
      fireEvent.click(within(container).getByText('Previous'))
      expect(onPageChange).toHaveBeenCalledWith(1)
    })

    it('calls onPageChange with next page', () => {
      const onPageChange = vi.fn()
      const { container } = render(
        <Pagination pagination={basePagination} onPageChange={onPageChange} />,
      )
      fireEvent.click(within(container).getByText('Next'))
      expect(onPageChange).toHaveBeenCalledWith(3)
    })

    it('disables Previous when no previous page', () => {
      const { container } = render(
        <Pagination
          pagination={{ ...basePagination, page: 1, previous: undefined }}
          onPageChange={() => {}}
        />,
      )
      expect(within(container).getByText('Previous')).toBeDisabled()
    })

    it('disables Next when no next page', () => {
      const { container } = render(
        <Pagination
          pagination={{ ...basePagination, page: 5, next: undefined }}
          onPageChange={() => {}}
        />,
      )
      expect(within(container).getByText('Next')).toBeDisabled()
    })
  })

  describe('compact variant', () => {
    it('shows page info', () => {
      const { container } = render(
        <Pagination pagination={basePagination} onPageChange={() => {}} variant="compact" />,
      )
      expect(within(container).getByText(/Page 2 of 5/)).toBeInTheDocument()
    })

    it('calls onPageChange using metadata previous/next, not arithmetic', () => {
      const onPageChange = vi.fn()
      // Use non-sequential page numbers to verify metadata is used
      const nonSequentialPagination: PaginationMetadata = {
        ...basePagination,
        page: 5,
        previous: 3, // gap: not page - 1
        next: 10, // gap: not page + 1
      }
      const { container } = render(
        <Pagination
          pagination={nonSequentialPagination}
          onPageChange={onPageChange}
          variant="compact"
        />,
      )
      const view = within(container)

      fireEvent.click(view.getByText('Prev'))
      expect(onPageChange).toHaveBeenCalledWith(3)

      fireEvent.click(view.getByText('Next'))
      expect(onPageChange).toHaveBeenCalledWith(10)
    })

    it('disables Prev when no previous page', () => {
      const { container } = render(
        <Pagination
          pagination={{ ...basePagination, previous: undefined }}
          onPageChange={() => {}}
          variant="compact"
        />,
      )
      expect(within(container).getByText('Prev')).toBeDisabled()
    })

    it('disables Next when no next page', () => {
      const { container } = render(
        <Pagination
          pagination={{ ...basePagination, next: undefined }}
          onPageChange={() => {}}
          variant="compact"
        />,
      )
      expect(within(container).getByText('Next')).toBeDisabled()
    })
  })
})
