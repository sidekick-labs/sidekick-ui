import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup, screen } from '@testing-library/react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from './alert-dialog'

afterEach(cleanup)

describe('AlertDialog', () => {
  it('renders with title and description', () => {
    render(
      <AlertDialog open>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
        </AlertDialogContent>
      </AlertDialog>,
    )
    expect(screen.getByText('Confirm Delete')).toBeInTheDocument()
    expect(screen.getByText('This action cannot be undone.')).toBeInTheDocument()
  })

  it('renders AlertDialogAction as a Button with variant="danger" by default', () => {
    render(
      <AlertDialog open>
        <AlertDialogContent>
          <AlertDialogTitle>Title</AlertDialogTitle>
          <AlertDialogFooter>
            <AlertDialogAction>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>,
    )
    const action = screen.getByRole('button', { name: 'Delete' })
    expect(action).toBeInTheDocument()
    expect(action.className).toContain('bg-[var(--color-danger)]')
  })

  it('renders AlertDialogCancel as a Button with variant="ghost" by default', () => {
    render(
      <AlertDialog open>
        <AlertDialogContent>
          <AlertDialogTitle>Title</AlertDialogTitle>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>,
    )
    const cancel = screen.getByRole('button', { name: 'Cancel' })
    expect(cancel).toBeInTheDocument()
    expect(cancel.className).toContain('hover:bg-[var(--color-surface-hover)]')
  })

  it('accepts custom variant prop on AlertDialogAction', () => {
    render(
      <AlertDialog open>
        <AlertDialogContent>
          <AlertDialogTitle>Title</AlertDialogTitle>
          <AlertDialogFooter>
            <AlertDialogAction variant="primary">Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>,
    )
    const action = screen.getByRole('button', { name: 'Confirm' })
    expect(action.className).toContain('bg-[var(--color-primary)]')
    expect(action.className).not.toContain('bg-[var(--color-danger)]')
  })

  it('accepts custom variant prop on AlertDialogCancel', () => {
    render(
      <AlertDialog open>
        <AlertDialogContent>
          <AlertDialogTitle>Title</AlertDialogTitle>
          <AlertDialogFooter>
            <AlertDialogCancel variant="outline">Back</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>,
    )
    const cancel = screen.getByRole('button', { name: 'Back' })
    expect(cancel.className).toContain('border-[var(--color-primary)]')
    expect(cancel.className).not.toContain('hover:bg-[var(--color-surface-hover)]')
  })
})
