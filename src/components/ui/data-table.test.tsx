import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup, within } from '@testing-library/react'
import { createRef } from 'react'
import { DataTable, TableHeader, TableBody, TableRow, TableHead, TableCell } from './data-table'

afterEach(cleanup)

describe('DataTable', () => {
  it('renders a table element', () => {
    const { container } = render(<DataTable />)
    expect(container.querySelector('table')).toBeInTheDocument()
  })

  it('applies base styles', () => {
    const { container } = render(<DataTable />)
    const table = container.querySelector('table')!
    expect(table.className).toContain('w-full')
    expect(table.className).toContain('border-collapse')
  })

  it('forwards ref', () => {
    const ref = createRef<HTMLTableElement>()
    render(<DataTable ref={ref} />)
    expect(ref.current).toBeInstanceOf(HTMLTableElement)
  })

  it('merges custom className', () => {
    const { container } = render(<DataTable className="custom-class" />)
    expect(container.querySelector('table')).toHaveClass('custom-class')
  })
})

describe('TableHeader', () => {
  it('renders a thead element', () => {
    const { container } = render(
      <table>
        <TableHeader />
      </table>,
    )
    expect(container.querySelector('thead')).toBeInTheDocument()
  })

  it('forwards ref', () => {
    const ref = createRef<HTMLTableSectionElement>()
    render(
      <table>
        <TableHeader ref={ref} />
      </table>,
    )
    expect(ref.current).toBeInstanceOf(HTMLTableSectionElement)
  })
})

describe('TableBody', () => {
  it('renders a tbody element', () => {
    const { container } = render(
      <table>
        <TableBody />
      </table>,
    )
    expect(container.querySelector('tbody')).toBeInTheDocument()
  })

  it('forwards ref', () => {
    const ref = createRef<HTMLTableSectionElement>()
    render(
      <table>
        <TableBody ref={ref} />
      </table>,
    )
    expect(ref.current).toBeInstanceOf(HTMLTableSectionElement)
  })
})

describe('TableRow', () => {
  it('renders a tr element', () => {
    const { container } = render(
      <table>
        <tbody>
          <TableRow />
        </tbody>
      </table>,
    )
    expect(container.querySelector('tr')).toBeInTheDocument()
  })

  it('applies hoverable styles when enabled', () => {
    const { container } = render(
      <table>
        <tbody>
          <TableRow hoverable />
        </tbody>
      </table>,
    )
    const tr = container.querySelector('tr')!
    expect(tr.className).toContain('hover:bg-[var(--color-surface-hover)]')
    expect(tr.className).toContain('transition-colors')
  })

  it('does not apply hoverable styles by default', () => {
    const { container } = render(
      <table>
        <tbody>
          <TableRow />
        </tbody>
      </table>,
    )
    const tr = container.querySelector('tr')!
    expect(tr.className).not.toContain('hover:bg-[var(--color-surface-hover)]')
  })

  it('forwards ref', () => {
    const ref = createRef<HTMLTableRowElement>()
    render(
      <table>
        <tbody>
          <TableRow ref={ref} />
        </tbody>
      </table>,
    )
    expect(ref.current).toBeInstanceOf(HTMLTableRowElement)
  })

  it('merges custom className', () => {
    const { container } = render(
      <table>
        <tbody>
          <TableRow className="custom-class" />
        </tbody>
      </table>,
    )
    expect(container.querySelector('tr')).toHaveClass('custom-class')
  })
})

describe('TableHead', () => {
  it('renders a th element', () => {
    const { container } = render(
      <table>
        <thead>
          <tr>
            <TableHead>Name</TableHead>
          </tr>
        </thead>
      </table>,
    )
    expect(container.querySelector('th')).toHaveTextContent('Name')
  })

  it('applies header styles', () => {
    const { container } = render(
      <table>
        <thead>
          <tr>
            <TableHead>Name</TableHead>
          </tr>
        </thead>
      </table>,
    )
    const th = container.querySelector('th')!
    expect(th.className).toContain('uppercase')
    expect(th.className).toContain('tracking-wide')
  })

  it('forwards ref', () => {
    const ref = createRef<HTMLTableCellElement>()
    render(
      <table>
        <thead>
          <tr>
            <TableHead ref={ref}>Name</TableHead>
          </tr>
        </thead>
      </table>,
    )
    expect(ref.current).toBeInstanceOf(HTMLTableCellElement)
  })

  it('merges custom className', () => {
    const { container } = render(
      <table>
        <thead>
          <tr>
            <TableHead className="custom-class">Name</TableHead>
          </tr>
        </thead>
      </table>,
    )
    expect(container.querySelector('th')).toHaveClass('custom-class')
  })
})

describe('TableCell', () => {
  it('renders a td element', () => {
    const { container } = render(
      <table>
        <tbody>
          <tr>
            <TableCell>Value</TableCell>
          </tr>
        </tbody>
      </table>,
    )
    expect(container.querySelector('td')).toHaveTextContent('Value')
  })

  it('applies cell styles', () => {
    const { container } = render(
      <table>
        <tbody>
          <tr>
            <TableCell>Value</TableCell>
          </tr>
        </tbody>
      </table>,
    )
    const td = container.querySelector('td')!
    expect(td.className).toContain('px-4')
    expect(td.className).toContain('align-middle')
  })

  it('forwards ref', () => {
    const ref = createRef<HTMLTableCellElement>()
    render(
      <table>
        <tbody>
          <tr>
            <TableCell ref={ref}>Value</TableCell>
          </tr>
        </tbody>
      </table>,
    )
    expect(ref.current).toBeInstanceOf(HTMLTableCellElement)
  })

  it('merges custom className', () => {
    const { container } = render(
      <table>
        <tbody>
          <tr>
            <TableCell className="custom-class">Value</TableCell>
          </tr>
        </tbody>
      </table>,
    )
    expect(container.querySelector('td')).toHaveClass('custom-class')
  })
})

describe('DataTable composition', () => {
  it('renders a full table with all subcomponents', () => {
    const { container } = render(
      <DataTable>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow hoverable>
            <TableCell>Alice</TableCell>
            <TableCell>Active</TableCell>
          </TableRow>
        </TableBody>
      </DataTable>,
    )
    expect(within(container).getByText('Name')).toBeInTheDocument()
    expect(within(container).getByText('Status')).toBeInTheDocument()
    expect(within(container).getByText('Alice')).toBeInTheDocument()
    expect(within(container).getByText('Active')).toBeInTheDocument()
  })
})
