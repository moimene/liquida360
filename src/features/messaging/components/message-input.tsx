import { useState, useRef } from 'react'
import { Send } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MessageInputProps {
  onSend: (content: string) => void
  disabled?: boolean
}

export function MessageInput({ onSend, disabled }: MessageInputProps) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function handleSubmit() {
    const trimmed = value.trim()
    if (!trimmed) return
    onSend(trimmed)
    setValue('')
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setValue(e.target.value)
    // Auto-resize
    const ta = e.target
    ta.style.height = 'auto'
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`
  }

  return (
    <div
      className="flex items-end gap-2 p-3"
      style={{
        borderTop: '1px solid var(--g-border-default)',
        backgroundColor: 'var(--g-surface-card)',
      }}
    >
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder="Escribe un mensaje..."
        disabled={disabled}
        rows={1}
        className="flex-1 resize-none text-sm px-3 py-2 outline-none"
        style={{
          backgroundColor: 'var(--g-surface-muted)',
          color: 'var(--g-text-primary)',
          borderRadius: 'var(--g-radius-md)',
          border: '1px solid var(--g-border-default)',
          maxHeight: '120px',
          fontFamily: 'var(--g-font-family)',
        }}
      />
      <Button
        size="icon"
        onClick={handleSubmit}
        disabled={disabled || !value.trim()}
        style={{
          backgroundColor: 'var(--g-brand-3308)',
          color: 'var(--g-text-inverse)',
          borderRadius: 'var(--g-radius-md)',
        }}
        aria-label="Enviar mensaje"
      >
        <Send className="h-4 w-4" />
      </Button>
    </div>
  )
}
