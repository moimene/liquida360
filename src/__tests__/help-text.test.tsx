import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HelpText } from '@/components/ui/help-text'

describe('HelpText', () => {
  it('renders the text content', () => {
    render(<HelpText>Campo obligatorio</HelpText>)
    expect(screen.getByText('Campo obligatorio')).toBeDefined()
  })

  it('renders as a paragraph element', () => {
    const { container } = render(<HelpText>Texto</HelpText>)
    const p = container.querySelector('p')
    expect(p).toBeDefined()
  })

  it('applies the id prop for aria-describedby linking', () => {
    const { container } = render(<HelpText id="amount-help">Introduce el importe</HelpText>)
    const p = container.querySelector('p')
    expect(p?.id).toBe('amount-help')
  })

  it('renders info icon when icon prop is true', () => {
    const { container } = render(<HelpText icon>Con icono</HelpText>)
    const svg = container.querySelector('svg')
    expect(svg).toBeDefined()
  })

  it('does not render icon by default', () => {
    const { container } = render(<HelpText>Sin icono</HelpText>)
    const svg = container.querySelector('svg')
    expect(svg).toBeNull()
  })

  it('applies custom className', () => {
    const { container } = render(<HelpText className="mt-4">Texto</HelpText>)
    const p = container.querySelector('p')
    expect(p?.className).toContain('mt-4')
  })
})
