import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup, within } from '@testing-library/react'
import { createRef } from 'react'
import { FormField, FormInput, FormSelect, FormTextarea, FormLabel } from './form-field'

afterEach(cleanup)

describe('FormLabel', () => {
  it('renders label text', () => {
    const { container } = render(<FormLabel>Email</FormLabel>)
    expect(within(container).getByText('Email')).toBeInTheDocument()
  })

  it('applies uppercase tracking styles', () => {
    const { container } = render(<FormLabel>Email</FormLabel>)
    const el = within(container).getByText('Email')
    expect(el.className).toContain('uppercase')
    expect(el.className).toContain('tracking-wider')
  })

  it('forwards ref', () => {
    const ref = createRef<HTMLLabelElement>()
    render(<FormLabel ref={ref}>Label</FormLabel>)
    expect(ref.current).toBeInstanceOf(HTMLLabelElement)
  })

  it('merges custom className', () => {
    const { container } = render(<FormLabel className="custom-class">Label</FormLabel>)
    expect(within(container).getByText('Label')).toHaveClass('custom-class')
  })
})

describe('FormInput', () => {
  it('renders an input element', () => {
    const { container } = render(<FormInput />)
    expect(container.querySelector('input')).toBeInTheDocument()
  })

  it('applies default styling', () => {
    const { container } = render(<FormInput />)
    const input = container.querySelector('input')!
    expect(input.className).toContain('w-full')
    expect(input.className).toContain('px-3')
  })

  it('applies search variant', () => {
    const { container } = render(<FormInput variant="search" />)
    const input = container.querySelector('input')!
    expect(input.className).toContain('pl-8')
  })

  it('applies error styling', () => {
    const { container } = render(<FormInput error="Required" />)
    const input = container.querySelector('input')!
    expect(input.className).toContain('border-[var(--color-danger)]')
  })

  it('forwards ref', () => {
    const ref = createRef<HTMLInputElement>()
    render(<FormInput ref={ref} />)
    expect(ref.current).toBeInstanceOf(HTMLInputElement)
  })

  it('merges custom className', () => {
    const { container } = render(<FormInput className="custom-class" />)
    expect(container.querySelector('input')).toHaveClass('custom-class')
  })
})

describe('FormSelect', () => {
  const options = [
    { label: 'Option A', value: 'a' },
    { label: 'Option B', value: 'b' },
  ]

  it('renders a select with options', () => {
    const { container } = render(<FormSelect options={options} />)
    const select = container.querySelector('select')!
    expect(select).toBeInTheDocument()
    expect(within(select).getByText('Option A')).toBeInTheDocument()
    expect(within(select).getByText('Option B')).toBeInTheDocument()
  })

  it('renders placeholder option', () => {
    const { container } = render(<FormSelect options={options} placeholder="Choose..." />)
    const select = container.querySelector('select')!
    expect(within(select).getByText('Choose...')).toBeInTheDocument()
  })

  it('applies error styling', () => {
    const { container } = render(<FormSelect options={options} error="Required" />)
    const select = container.querySelector('select')!
    expect(select.className).toContain('border-[var(--color-danger)]')
  })

  it('forwards ref', () => {
    const ref = createRef<HTMLSelectElement>()
    render(<FormSelect ref={ref} options={options} />)
    expect(ref.current).toBeInstanceOf(HTMLSelectElement)
  })

  it('merges custom className', () => {
    const { container } = render(<FormSelect className="custom-class" options={options} />)
    expect(container.querySelector('select')).toHaveClass('custom-class')
  })
})

describe('FormTextarea', () => {
  it('renders a textarea element', () => {
    const { container } = render(<FormTextarea />)
    expect(container.querySelector('textarea')).toBeInTheDocument()
  })

  it('applies min-height and resize styles', () => {
    const { container } = render(<FormTextarea />)
    const textarea = container.querySelector('textarea')!
    expect(textarea.className).toContain('min-h-[80px]')
    expect(textarea.className).toContain('resize-y')
  })

  it('applies error styling', () => {
    const { container } = render(<FormTextarea error="Required" />)
    const textarea = container.querySelector('textarea')!
    expect(textarea.className).toContain('border-[var(--color-danger)]')
  })

  it('forwards ref', () => {
    const ref = createRef<HTMLTextAreaElement>()
    render(<FormTextarea ref={ref} />)
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement)
  })

  it('merges custom className', () => {
    const { container } = render(<FormTextarea className="custom-class" />)
    expect(container.querySelector('textarea')).toHaveClass('custom-class')
  })
})

describe('FormField', () => {
  it('renders children', () => {
    const { container } = render(
      <FormField>
        <input />
      </FormField>,
    )
    expect(container.querySelector('input')).toBeInTheDocument()
  })

  it('renders label when provided', () => {
    const { container } = render(
      <FormField label="Email">
        <input />
      </FormField>,
    )
    expect(within(container).getByText('Email')).toBeInTheDocument()
  })

  it('renders error message when provided', () => {
    const { container } = render(
      <FormField error="This field is required">
        <input />
      </FormField>,
    )
    expect(within(container).getByText('This field is required')).toBeInTheDocument()
  })

  it('forwards ref', () => {
    const ref = createRef<HTMLDivElement>()
    render(
      <FormField ref={ref}>
        <input />
      </FormField>,
    )
    expect(ref.current).toBeInstanceOf(HTMLDivElement)
  })

  it('merges custom className', () => {
    const { container } = render(
      <FormField className="custom-class">
        <input />
      </FormField>,
    )
    expect(container.firstChild).toHaveClass('custom-class')
  })
})
