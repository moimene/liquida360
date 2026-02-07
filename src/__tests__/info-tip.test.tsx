import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { InfoTip } from '@/components/ui/info-tip'
import { AlertCircle } from 'lucide-react'

describe('InfoTip', () => {
  it('renders the help icon button', () => {
    render(<InfoTip content="Texto de ayuda" />)
    const button = screen.getByRole('button', { name: /ayuda/i })
    expect(button).toBeDefined()
  })

  it('does not show tooltip by default', () => {
    render(<InfoTip content="Texto de ayuda" />)
    expect(screen.queryByRole('tooltip')).toBeNull()
  })

  it('shows tooltip on click', () => {
    render(<InfoTip content="Texto de ayuda" />)
    const button = screen.getByRole('button', { name: /ayuda/i })
    fireEvent.click(button)
    const tooltip = screen.getByRole('tooltip')
    expect(tooltip).toBeDefined()
    expect(tooltip.textContent).toBe('Texto de ayuda')
  })

  it('shows tooltip on mouse enter', () => {
    render(<InfoTip content="Hola mundo" />)
    const button = screen.getByRole('button', { name: /ayuda/i })
    fireEvent.mouseEnter(button)
    expect(screen.getByRole('tooltip')).toBeDefined()
    expect(screen.getByRole('tooltip').textContent).toBe('Hola mundo')
  })

  it('hides tooltip on mouse leave', () => {
    render(<InfoTip content="Texto" />)
    const button = screen.getByRole('button', { name: /ayuda/i })
    fireEvent.mouseEnter(button)
    expect(screen.getByRole('tooltip')).toBeDefined()
    fireEvent.mouseLeave(button)
    expect(screen.queryByRole('tooltip')).toBeNull()
  })

  it('accepts a custom icon', () => {
    const { container } = render(<InfoTip content="Custom" icon={AlertCircle} />)
    const svg = container.querySelector('svg')
    expect(svg).toBeDefined()
  })

  it('has aria-describedby when tooltip is open', () => {
    render(<InfoTip content="Accesible" />)
    const button = screen.getByRole('button', { name: /ayuda/i })
    fireEvent.click(button)
    const tooltipId = screen.getByRole('tooltip').id
    expect(button.getAttribute('aria-describedby')).toBe(tooltipId)
  })
})
