import { useEffect, useRef } from 'react'

const Modal = ({ open, onClose, title, children, className = '', style }) => {
  const dialogRef = useRef(null)

  useEffect(() => {
    if (!open) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.()
      if (event.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        if (!focusable.length) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    const focusTarget = dialogRef.current?.querySelector('button, input, textarea, select')
    focusTarget?.focus()

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        display: 'grid',
        placeItems: 'center',
        background: 'rgba(15, 23, 42, 0.5)',
        padding: 'var(--space-4)',
        zIndex: 2000,
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        onClick={(event) => event.stopPropagation()}
        className={['ui-modal', className].filter(Boolean).join(' ')}
        style={{
          width: 'min(100%, 540px)',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 24px 50px rgba(15, 23, 42, 0.18)',
          ...(style || {}),
        }}
      >
        {title && (
          <div style={{ padding: 'var(--space-5) var(--space-5) 0' }}>
            <h3 id="modal-title" style={{ margin: 0, color: 'var(--color-text-primary)', fontSize: '1.1rem' }}>{title}</h3>
          </div>
        )}
        <div style={{ padding: 'var(--space-5)' }}>{children}</div>
      </div>
    </div>
  )
}

export default Modal
