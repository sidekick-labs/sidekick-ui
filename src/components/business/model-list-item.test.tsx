import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent, within } from '@testing-library/react'
import { createRef } from 'react'
import { ModelListItem } from './model-list-item'
import type { ModelListItemModel } from './model-list-item'
import { TooltipProvider } from '@/components/ui/tooltip'

const baseModel: ModelListItemModel = {
  id: 'gpt-4',
  name: 'GPT-4',
  provider: 'OpenAI',
}

describe('ModelListItem', () => {
  it('renders model name', () => {
    const { container } = render(<ModelListItem model={baseModel} />)
    expect(within(container).getByText('GPT-4')).toBeInTheDocument()
  })

  it('renders provider', () => {
    const { container } = render(<ModelListItem model={baseModel} />)
    expect(within(container).getByText('OpenAI')).toBeInTheDocument()
  })

  it('renders family when provided', () => {
    const model = { ...baseModel, family: 'GPT' }
    const { container } = render(<ModelListItem model={model} />)
    expect(within(container).getByText('GPT')).toBeInTheDocument()
  })

  it('renders context window info when provided', () => {
    const model = { ...baseModel, contextWindow: 128000 }
    const { container } = render(<ModelListItem model={model} />)
    expect(within(container).getByText(/Input: 128K/)).toBeInTheDocument()
  })

  it('does not render stray separator when family is absent', () => {
    const model = { ...baseModel, contextWindow: 128000 }
    const { container } = render(<ModelListItem model={model} />)
    // Provider and context window are separated by ·, but only one · should exist
    const metaRow = container.querySelector('.mt-2.flex')!
    const separators = Array.from(metaRow.children).filter((el) => el.textContent === '·')
    expect(separators).toHaveLength(1)
  })

  it('formats large context windows as M', () => {
    const model = { ...baseModel, contextWindow: 1000000 }
    const { container } = render(<ModelListItem model={model} />)
    expect(within(container).getByText(/Input: 1M/)).toBeInTheDocument()
  })

  it('formats fractional million context windows', () => {
    const model = { ...baseModel, contextWindow: 2500000 }
    const { container } = render(<ModelListItem model={model} />)
    expect(within(container).getByText(/Input: 2\.5M/)).toBeInTheDocument()
  })

  it('renders output tokens alongside context window', () => {
    const model = { ...baseModel, contextWindow: 128000, maxOutputTokens: 4096 }
    const { container } = render(<ModelListItem model={model} />)
    expect(within(container).getByText(/Output: 4K/)).toBeInTheDocument()
  })

  it('does not render context window when not provided', () => {
    const { container } = render(<ModelListItem model={baseModel} />)
    expect(within(container).queryByText(/Input:/)).not.toBeInTheDocument()
  })

  it('does not render context window when value is 0', () => {
    const model = { ...baseModel, contextWindow: 0 }
    const { container } = render(<ModelListItem model={model} />)
    expect(within(container).queryByText(/Input:/)).not.toBeInTheDocument()
  })

  it('formats sub-1K token counts as plain numbers', () => {
    const model = { ...baseModel, contextWindow: 512 }
    const { container } = render(<ModelListItem model={model} />)
    expect(within(container).getByText(/Input: 512/)).toBeInTheDocument()
  })

  it('rounds 1K–999K values (1500 → 2K)', () => {
    const model = { ...baseModel, contextWindow: 1500 }
    const { container } = render(<ModelListItem model={model} />)
    expect(within(container).getByText(/Input: 2K/)).toBeInTheDocument()
  })

  it('renders capability icons with accessible labels', () => {
    const model = { ...baseModel, capabilities: ['streaming', 'vision'] }
    const { container } = render(
      <TooltipProvider>
        <ModelListItem model={model} />
      </TooltipProvider>,
    )
    expect(within(container).getByText('Streaming')).toHaveClass('sr-only')
    expect(within(container).getByText('Vision')).toHaveClass('sr-only')
  })

  it('renders unknown capability with formatted label', () => {
    const model = { ...baseModel, capabilities: ['custom_tool'] }
    const { container } = render(
      <TooltipProvider>
        <ModelListItem model={model} />
      </TooltipProvider>,
    )
    expect(within(container).getByText('Custom Tool')).toHaveClass('sr-only')
  })

  it('does not render capabilities section when empty', () => {
    const model = { ...baseModel, capabilities: [] }
    const { container } = render(<ModelListItem model={model} />)
    expect(within(container).queryByText('Streaming')).not.toBeInTheDocument()
  })

  it('renders pricing info when provided', () => {
    const model = {
      ...baseModel,
      pricing: { inputTokenCost: '2.50', outputTokenCost: '10.00' },
    }
    const { container } = render(<ModelListItem model={model} />)
    expect(within(container).getByText('$2.50/1M in')).toBeInTheDocument()
    expect(within(container).getByText('$10.00/1M out')).toBeInTheDocument()
  })

  it('renders pricing when cost is "0"', () => {
    const model = {
      ...baseModel,
      pricing: { inputTokenCost: '0', outputTokenCost: '0' },
    }
    const { container } = render(<ModelListItem model={model} />)
    expect(within(container).getByText('$0/1M in')).toBeInTheDocument()
    expect(within(container).getByText('$0/1M out')).toBeInTheDocument()
  })

  it('renders output-only pricing without dangling separator', () => {
    const model = {
      ...baseModel,
      pricing: { outputTokenCost: '10.00' },
    }
    const { container } = render(<ModelListItem model={model} />)
    expect(within(container).getByText('$10.00/1M out')).toBeInTheDocument()
    expect(within(container).queryByText(/in/)).not.toBeInTheDocument()
  })

  it('renders input-only pricing', () => {
    const model = {
      ...baseModel,
      pricing: { inputTokenCost: '2.50' },
    }
    const { container } = render(<ModelListItem model={model} />)
    expect(within(container).getByText('$2.50/1M in')).toBeInTheDocument()
    expect(within(container).queryByText(/out/)).not.toBeInTheDocument()
  })

  it('renders knowledge cutoff when provided', () => {
    const model = { ...baseModel, knowledgeCutoff: 'Apr 2024' }
    const { container } = render(<ModelListItem model={model} />)
    expect(within(container).getByText('Updated: Apr 2024')).toBeInTheDocument()
  })

  it('renders separator between pricing and knowledge cutoff', () => {
    const model = {
      ...baseModel,
      pricing: { inputTokenCost: '2.50' },
      knowledgeCutoff: 'Apr 2024',
    }
    const { container } = render(<ModelListItem model={model} />)
    expect(within(container).getByText('$2.50/1M in')).toBeInTheDocument()
    expect(within(container).getByText('Updated: Apr 2024')).toBeInTheDocument()
    // Verify · separator exists between them in the meta row
    const meta = container.querySelector('.mt-2:last-child')!
    const texts = Array.from(meta.children).map((el) => el.textContent)
    expect(texts).toContain('·')
  })

  it('does not render empty string pricing', () => {
    const model = {
      ...baseModel,
      pricing: { inputTokenCost: '', outputTokenCost: '' },
    }
    const { container } = render(<ModelListItem model={model} />)
    expect(within(container).queryByText(/\/1M/)).not.toBeInTheDocument()
  })

  it('does not call onSelect when capability icon is clicked', () => {
    const onSelect = vi.fn()
    const model = { ...baseModel, capabilities: ['streaming'] }
    const { container } = render(
      <TooltipProvider>
        <ModelListItem model={model} onSelect={onSelect} />
      </TooltipProvider>,
    )
    const icon = within(container).getByText('Streaming').parentElement!
    fireEvent.click(icon)
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('calls onSelect with model when clicked', () => {
    const onSelect = vi.fn()
    const { container } = render(<ModelListItem model={baseModel} onSelect={onSelect} />)
    fireEvent.click(container.firstChild as HTMLElement)
    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onSelect).toHaveBeenCalledWith(baseModel)
  })

  it('calls onSelect via Enter key', () => {
    const onSelect = vi.fn()
    const { container } = render(<ModelListItem model={baseModel} onSelect={onSelect} />)
    fireEvent.keyDown(container.firstChild as HTMLElement, { key: 'Enter' })
    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onSelect).toHaveBeenCalledWith(baseModel)
  })

  it('calls onSelect via Space key', () => {
    const onSelect = vi.fn()
    const { container } = render(<ModelListItem model={baseModel} onSelect={onSelect} />)
    fireEvent.keyDown(container.firstChild as HTMLElement, { key: ' ' })
    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onSelect).toHaveBeenCalledWith(baseModel)
  })

  it('sets role="button" and tabIndex when onSelect is provided', () => {
    const { container } = render(<ModelListItem model={baseModel} onSelect={() => {}} />)
    const root = container.firstChild as HTMLElement
    expect(root).toHaveAttribute('role', 'button')
    expect(root).toHaveAttribute('tabindex', '0')
  })

  it('does not set role or tabIndex when onSelect is not provided', () => {
    const { container } = render(<ModelListItem model={baseModel} />)
    const root = container.firstChild as HTMLElement
    expect(root).not.toHaveAttribute('role')
    expect(root).not.toHaveAttribute('tabindex')
  })

  it('does not attach onClick when onSelect is not provided', () => {
    const { container } = render(<ModelListItem model={baseModel} />)
    expect((container.firstChild as HTMLElement).onclick).toBeNull()
  })

  it('applies cursor-pointer when onSelect is provided', () => {
    const { container } = render(<ModelListItem model={baseModel} onSelect={() => {}} />)
    expect((container.firstChild as HTMLElement).className).toContain('cursor-pointer')
  })

  it('does not apply cursor-pointer when onSelect is not provided', () => {
    const { container } = render(<ModelListItem model={baseModel} />)
    expect((container.firstChild as HTMLElement).className).not.toContain('cursor-pointer')
  })

  it('applies active style when selected', () => {
    const { container } = render(<ModelListItem model={baseModel} selected />)
    expect((container.firstChild as HTMLElement).className).toContain(
      'bg-[var(--color-surface-hover)]',
    )
  })

  it('communicates selected state via aria-pressed', () => {
    const { container } = render(<ModelListItem model={baseModel} selected onSelect={() => {}} />)
    expect(container.firstChild).toHaveAttribute('aria-pressed', 'true')
  })

  it('communicates unselected state via aria-pressed', () => {
    const { container } = render(<ModelListItem model={baseModel} onSelect={() => {}} />)
    expect(container.firstChild).toHaveAttribute('aria-pressed', 'false')
  })

  it('does not set aria-pressed when not interactive', () => {
    const { container } = render(<ModelListItem model={baseModel} selected />)
    expect(container.firstChild).not.toHaveAttribute('aria-pressed')
  })

  it('forwards ref', () => {
    const ref = createRef<HTMLDivElement>()
    render(<ModelListItem ref={ref} model={baseModel} />)
    expect(ref.current).toBeInstanceOf(HTMLDivElement)
  })

  it('merges custom className', () => {
    const { container } = render(<ModelListItem model={baseModel} className="custom-class" />)
    expect(container.firstChild).toHaveClass('custom-class')
  })
})
