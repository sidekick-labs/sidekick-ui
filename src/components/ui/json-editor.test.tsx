import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, fireEvent, cleanup, screen } from '@testing-library/react'
import { createRef } from 'react'
import { JsonEditor } from './json-editor'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  cleanup()
})

describe('JsonEditor', () => {
  it('renders textarea with value', () => {
    const { container } = render(<JsonEditor value='{"key": "value"}' onChange={() => {}} />)
    const textarea = container.querySelector('textarea')
    expect(textarea).toBeInTheDocument()
    expect(textarea).toHaveValue('{"key": "value"}')
  })

  it('calls onChange when typing', () => {
    const onChange = vi.fn()
    const { container } = render(<JsonEditor value="" onChange={onChange} />)
    fireEvent.change(container.querySelector('textarea')!, { target: { value: '{"a":1}' } })
    expect(onChange).toHaveBeenCalledWith('{"a":1}')
  })

  it('renders label when provided', () => {
    render(<JsonEditor value="" onChange={() => {}} label="JSON Data" />)
    expect(screen.getByText('JSON Data')).toBeInTheDocument()
  })

  it('associates label with textarea via htmlFor/id', () => {
    const { container } = render(<JsonEditor value="" onChange={() => {}} label="Metadata" />)
    const label = container.querySelector('label')
    const textarea = container.querySelector('textarea')
    expect(label).toHaveAttribute('for')
    expect(textarea).toHaveAttribute('id', label!.getAttribute('for'))
  })

  it('renders helper text', () => {
    render(<JsonEditor value="" onChange={() => {}} helperText="Enter valid JSON" />)
    expect(screen.getByText('Enter valid JSON')).toBeInTheDocument()
  })

  it('renders placeholder', () => {
    const { container } = render(
      <JsonEditor value="" onChange={() => {}} placeholder="Type JSON here" />,
    )
    expect(container.querySelector('textarea')).toHaveAttribute('placeholder', 'Type JSON here')
  })

  it('renders with custom rows', () => {
    const { container } = render(<JsonEditor value="" onChange={() => {}} rows={20} />)
    expect(container.querySelector('textarea')).toHaveAttribute('rows', '20')
  })

  it('is disabled when disabled prop is set', () => {
    const { container } = render(<JsonEditor value="" onChange={() => {}} disabled />)
    expect(container.querySelector('textarea')).toBeDisabled()
  })

  it('renders format button', () => {
    render(<JsonEditor value='{"a":1}' onChange={() => {}} />)
    expect(screen.getByText('Format')).toBeInTheDocument()
  })

  it('format button calls onChange with formatted JSON', () => {
    const onChange = vi.fn()
    render(<JsonEditor value='{"a":1}' onChange={onChange} />)
    fireEvent.click(screen.getByText('Format'))
    expect(onChange).toHaveBeenCalledWith('{\n  "a": 1\n}')
  })

  it('format button is disabled when JSON is invalid', () => {
    render(<JsonEditor value="{invalid" onChange={() => {}} />)
    expect(screen.getByText('Format').closest('button')).toBeDisabled()
  })

  it('format button is disabled when editor is disabled', () => {
    render(<JsonEditor value='{"a":1}' onChange={() => {}} disabled />)
    expect(screen.getByText('Format').closest('button')).toBeDisabled()
  })

  it('displays syntax errors for invalid JSON', () => {
    render(<JsonEditor value="{bad json" onChange={() => {}} />)
    expect(screen.getByText('Validation Error')).toBeInTheDocument()
  })

  it('displays external errors', () => {
    render(<JsonEditor value='{"a":1}' onChange={() => {}} errors={['Field is required']} />)
    expect(screen.getByText('Field is required')).toBeInTheDocument()
  })

  it('renders schema hints', () => {
    const hints = [
      { name: 'name', type: 'string', description: 'The name', required: true },
      { name: 'age', type: 'number' },
    ]
    render(<JsonEditor value="" onChange={() => {}} schemaHints={hints} />)
    expect(screen.getByText('Expected properties')).toBeInTheDocument()
  })

  it('forwards ref to textarea', () => {
    const ref = createRef<HTMLTextAreaElement>()
    render(<JsonEditor ref={ref} value="" onChange={() => {}} />)
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement)
  })

  it('merges custom className', () => {
    const { container } = render(
      <JsonEditor value="" onChange={() => {}} className="custom-class" />,
    )
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('right-aligns format button when no label is provided', () => {
    const { container } = render(<JsonEditor value='{"a":1}' onChange={() => {}} />)
    const header = container.querySelector('.flex')
    expect(header).toHaveClass('justify-end')
  })

  describe('onValidate', () => {
    it('calls onValidate with parsed data after debounce', async () => {
      const onValidate = vi.fn().mockResolvedValue([])
      render(<JsonEditor value='{"a":1}' onChange={() => {}} onValidate={onValidate} />)

      await vi.advanceTimersByTimeAsync(500)

      expect(onValidate).toHaveBeenCalledTimes(1)
      expect(onValidate).toHaveBeenCalledWith({ a: 1 })
    })

    it('does not call onValidate before debounce period', () => {
      const onValidate = vi.fn().mockResolvedValue([])
      render(<JsonEditor value='{"a":1}' onChange={() => {}} onValidate={onValidate} />)

      vi.advanceTimersByTime(499)

      expect(onValidate).not.toHaveBeenCalled()
    })

    it('displays validation errors returned by onValidate', async () => {
      const onValidate = vi.fn().mockResolvedValue(['name is required', 'age must be positive'])
      render(<JsonEditor value='{"a":1}' onChange={() => {}} onValidate={onValidate} />)

      // Advance past the debounce, then flush the resolved promise microtask
      await vi.advanceTimersByTimeAsync(500)
      // Let the resolved promise and setState propagate
      await vi.advanceTimersByTimeAsync(0)

      expect(screen.getByText('name is required')).toBeInTheDocument()
      expect(screen.getByText('age must be positive')).toBeInTheDocument()
    })

    it('does not call onValidate when JSON has syntax errors', async () => {
      const onValidate = vi.fn().mockResolvedValue([])
      render(<JsonEditor value="{bad" onChange={() => {}} onValidate={onValidate} />)

      await vi.advanceTimersByTimeAsync(500)

      expect(onValidate).not.toHaveBeenCalled()
    })

    it('does not call onValidate when value is empty', async () => {
      const onValidate = vi.fn().mockResolvedValue([])
      render(<JsonEditor value="" onChange={() => {}} onValidate={onValidate} />)

      await vi.advanceTimersByTimeAsync(500)

      expect(onValidate).not.toHaveBeenCalled()
    })

    it('does not write to console when onValidate rejects', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const onValidate = vi.fn().mockRejectedValue(new Error('network fail'))
      render(<JsonEditor value='{"a":1}' onChange={() => {}} onValidate={onValidate} />)

      await vi.advanceTimersByTimeAsync(500)
      // Let the rejected promise settle
      await vi.advanceTimersByTimeAsync(0)

      expect(onValidate).toHaveBeenCalledTimes(1)
      expect(consoleSpy).not.toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })
})
