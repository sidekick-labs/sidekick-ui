import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup, within } from '@testing-library/react'
import { createRef } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './card'

afterEach(cleanup)

describe('Card', () => {
  it('renders children', () => {
    const { container } = render(<Card>Card content</Card>)
    expect(within(container).getByText('Card content')).toBeInTheDocument()
  })

  it('forwards ref', () => {
    const ref = createRef<HTMLDivElement>()
    render(<Card ref={ref}>Content</Card>)
    expect(ref.current).toBeInstanceOf(HTMLDivElement)
  })

  it('merges custom className', () => {
    const { container } = render(<Card className="custom-class">Content</Card>)
    expect(container.firstChild).toHaveClass('custom-class')
  })
})

describe('CardHeader', () => {
  it('renders children', () => {
    const { container } = render(<CardHeader>Header</CardHeader>)
    expect(within(container).getByText('Header')).toBeInTheDocument()
  })

  it('applies default md padding', () => {
    const { container } = render(<CardHeader>Header</CardHeader>)
    expect(container.firstChild).toHaveClass('p-4')
  })

  it('applies sm padding variant', () => {
    const { container } = render(<CardHeader padding="sm">Header</CardHeader>)
    expect(container.firstChild).toHaveClass('p-3')
  })

  it('applies lg padding variant', () => {
    const { container } = render(<CardHeader padding="lg">Header</CardHeader>)
    expect(container.firstChild).toHaveClass('p-6')
  })

  it('forwards ref', () => {
    const ref = createRef<HTMLDivElement>()
    render(<CardHeader ref={ref}>Header</CardHeader>)
    expect(ref.current).toBeInstanceOf(HTMLDivElement)
  })
})

describe('CardTitle', () => {
  it('renders as h3 by default', () => {
    const { container } = render(<CardTitle>Title</CardTitle>)
    expect(container.querySelector('h3')).toHaveTextContent('Title')
  })

  it('renders as child element when asChild is true', () => {
    const { container } = render(
      <CardTitle asChild>
        <h2>Custom heading</h2>
      </CardTitle>,
    )
    expect(container.querySelector('h2')).toHaveTextContent('Custom heading')
    expect(container.querySelector('h3')).toBeNull()
  })

  it('forwards ref', () => {
    const ref = createRef<HTMLHeadingElement>()
    render(<CardTitle ref={ref}>Title</CardTitle>)
    expect(ref.current).toBeInstanceOf(HTMLHeadingElement)
  })
})

describe('CardDescription', () => {
  it('renders as a paragraph', () => {
    const { container } = render(<CardDescription>Description text</CardDescription>)
    expect(container.querySelector('p')).toHaveTextContent('Description text')
  })

  it('forwards ref', () => {
    const ref = createRef<HTMLParagraphElement>()
    render(<CardDescription ref={ref}>Desc</CardDescription>)
    expect(ref.current).toBeInstanceOf(HTMLParagraphElement)
  })
})

describe('CardContent', () => {
  it('renders children', () => {
    const { container } = render(<CardContent>Body</CardContent>)
    expect(within(container).getByText('Body')).toBeInTheDocument()
  })

  it('applies default md padding', () => {
    const { container } = render(<CardContent>Body</CardContent>)
    expect(container.firstChild).toHaveClass('p-4')
  })

  it('applies sm padding variant', () => {
    const { container } = render(<CardContent padding="sm">Body</CardContent>)
    expect(container.firstChild).toHaveClass('p-3')
  })

  it('forwards ref', () => {
    const ref = createRef<HTMLDivElement>()
    render(<CardContent ref={ref}>Body</CardContent>)
    expect(ref.current).toBeInstanceOf(HTMLDivElement)
  })
})

describe('CardFooter', () => {
  it('renders children', () => {
    const { container } = render(<CardFooter>Footer</CardFooter>)
    expect(within(container).getByText('Footer')).toBeInTheDocument()
  })

  it('applies default md padding', () => {
    const { container } = render(<CardFooter>Footer</CardFooter>)
    expect(container.firstChild).toHaveClass('p-4')
  })

  it('forwards ref', () => {
    const ref = createRef<HTMLDivElement>()
    render(<CardFooter ref={ref}>Footer</CardFooter>)
    expect(ref.current).toBeInstanceOf(HTMLDivElement)
  })
})

describe('Card composition', () => {
  it('renders a full card with all subcomponents', () => {
    const { container } = render(
      <Card>
        <CardHeader>
          <CardTitle>My Card</CardTitle>
          <CardDescription>A description</CardDescription>
        </CardHeader>
        <CardContent>Main content</CardContent>
        <CardFooter>Footer actions</CardFooter>
      </Card>,
    )
    expect(within(container).getByText('My Card')).toBeInTheDocument()
    expect(within(container).getByText('A description')).toBeInTheDocument()
    expect(within(container).getByText('Main content')).toBeInTheDocument()
    expect(within(container).getByText('Footer actions')).toBeInTheDocument()
  })
})
