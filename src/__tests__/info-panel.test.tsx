import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { InfoPanel } from '@/components/ui/info-panel'

describe('InfoPanel', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renders children content', () => {
    render(<InfoPanel>Texto informativo</InfoPanel>)
    expect(screen.getByText('Texto informativo')).toBeDefined()
  })

  it('has role="note"', () => {
    render(<InfoPanel>Info</InfoPanel>)
    expect(screen.getByRole('note')).toBeDefined()
  })

  it('renders with info variant by default', () => {
    const { container } = render(<InfoPanel>Info default</InfoPanel>)
    const panel = container.firstElementChild as HTMLElement
    expect(panel.style.borderLeft).toContain('var(--status-info)')
  })

  it('renders with tip variant', () => {
    const { container } = render(<InfoPanel variant="tip">Consejo</InfoPanel>)
    const panel = container.firstElementChild as HTMLElement
    expect(panel.style.borderLeft).toContain('var(--g-brand-3308)')
  })

  it('renders with warning variant', () => {
    const { container } = render(<InfoPanel variant="warning">Aviso</InfoPanel>)
    const panel = container.firstElementChild as HTMLElement
    expect(panel.style.borderLeft).toContain('var(--status-error)')
  })

  it('shows dismiss button when dismissible', () => {
    render(<InfoPanel dismissible>Cerrable</InfoPanel>)
    const button = screen.getByRole('button', { name: /cerrar/i })
    expect(button).toBeDefined()
  })

  it('hides panel when dismissed', () => {
    render(<InfoPanel dismissible>Panel</InfoPanel>)
    fireEvent.click(screen.getByRole('button', { name: /cerrar/i }))
    expect(screen.queryByRole('note')).toBeNull()
  })

  it('persists dismissal in localStorage when dismissKey provided', () => {
    render(
      <InfoPanel dismissible dismissKey="test-panel">
        Persistente
      </InfoPanel>,
    )
    fireEvent.click(screen.getByRole('button', { name: /cerrar/i }))
    expect(localStorage.getItem('liquida360:dismiss:test-panel')).toBe('true')
  })

  it('starts dismissed if localStorage has dismissKey', () => {
    localStorage.setItem('liquida360:dismiss:saved-panel', 'true')
    render(
      <InfoPanel dismissible dismissKey="saved-panel">
        No visible
      </InfoPanel>,
    )
    expect(screen.queryByRole('note')).toBeNull()
  })

  it('does not show dismiss button when not dismissible', () => {
    render(<InfoPanel>No cerrable</InfoPanel>)
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('renders an icon', () => {
    const { container } = render(<InfoPanel>Con icono</InfoPanel>)
    const svg = container.querySelector('svg')
    expect(svg).toBeDefined()
  })
})
