import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { EmptyState } from '@/components/ui/empty-state'
import { FileText } from 'lucide-react'

describe('EmptyState', () => {
  it('renders title', () => {
    render(<EmptyState title="No hay datos" />)
    expect(screen.getByText('No hay datos')).toBeDefined()
  })

  it('renders description when provided', () => {
    render(<EmptyState title="Vacío" description="Crea tu primer registro" />)
    expect(screen.getByText('Crea tu primer registro')).toBeDefined()
  })

  it('does not render description when not provided', () => {
    const { container } = render(<EmptyState title="Vacío" />)
    const paragraphs = container.querySelectorAll('p')
    expect(paragraphs.length).toBe(0)
  })

  it('renders CTA button when actionLabel and onAction provided', () => {
    const handleAction = vi.fn()
    render(<EmptyState title="Vacío" actionLabel="Crear" onAction={handleAction} />)
    const button = screen.getByText('Crear')
    expect(button).toBeDefined()
    fireEvent.click(button)
    expect(handleAction).toHaveBeenCalledTimes(1)
  })

  it('does not render CTA button when actionLabel not provided', () => {
    render(<EmptyState title="Vacío" />)
    const buttons = screen.queryByRole('button')
    expect(buttons).toBeNull()
  })

  it('accepts a custom icon', () => {
    const { container } = render(<EmptyState title="Vacío" icon={FileText} />)
    // The icon should be rendered as an SVG
    const svg = container.querySelector('svg')
    expect(svg).toBeDefined()
  })
})
