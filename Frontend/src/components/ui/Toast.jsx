import { useEffect, useState } from 'react'

const Toast = ({ message, tone = 'neutral', onClose }) => {
  useEffect(() => {
    const timeout = window.setTimeout(() => onClose?.(), 2500)
    return () => window.clearTimeout(timeout)
  }, [onClose])

  const toneStyles = {
    neutral: { background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' },
    success: { background: 'rgba(18, 184, 134, 0.12)', borderColor: 'rgba(18, 184, 134, 0.25)', color: 'var(--color-success)' },
    danger: { background: 'rgba(229, 72, 77, 0.12)', borderColor: 'rgba(229, 72, 77, 0.25)', color: 'var(--color-danger)' },
  }

  return (
    <div
      role="status"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
        padding: 'var(--space-3) var(--space-4)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--color-border)',
        background: 'var(--color-surface)',
        boxShadow: '0 10px 24px rgba(15, 23, 42, 0.12)',
        fontSize: '0.85rem',
        fontWeight: 600,
        ...toneStyles[tone],
      }}
    >
      {message}
    </div>
  )
}

export const useToast = () => {
  const [toasts, setToasts] = useState([])

  const push = (message, tone = 'neutral') => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`
    setToasts((current) => [...current, { id, message, tone }])
  }

  const dismiss = (id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }

  return {
    toasts,
    push,
    dismiss,
    ToastContainer: () => (
      <div
        style={{
          position: 'fixed',
          right: 'var(--space-5)',
          bottom: 'var(--space-5)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-2)',
          zIndex: 3000,
        }}
      >
        {toasts.map((toast) => (
          <Toast key={toast.id} message={toast.message} tone={toast.tone} onClose={() => dismiss(toast.id)} />
        ))}
      </div>
    ),
  }
}

export default Toast
