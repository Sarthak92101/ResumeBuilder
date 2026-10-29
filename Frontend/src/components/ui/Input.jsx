import { useState } from 'react'

const Input = ({
  label,
  helperText,
  error,
  showPasswordToggle = false,
  className = '',
  id,
  style,
  ...props
}) => {
  const fieldId = id || label?.toLowerCase().replace(/\s+/g, '-')
  const [passwordVisible, setPasswordVisible] = useState(false)
  const hasPasswordToggle = showPasswordToggle && props.type === 'password'

  const input = (
    <input
      id={fieldId}
      className="ui-control"
      aria-invalid={Boolean(error)}
      {...props}
      type={hasPasswordToggle && passwordVisible ? 'text' : props.type}
      style={{
        width: '100%',
        minHeight: '46px',
        background: 'var(--color-input)',
        color: 'var(--color-text-primary)',
        border: `1px solid ${error ? 'var(--color-danger)' : 'var(--color-border)'}`,
        borderRadius: 'var(--radius-lg)',
        padding: hasPasswordToggle ? '0 3.1rem 0 var(--space-4)' : '0 var(--space-4)',
        fontFamily: 'var(--font-family)',
        fontSize: '0.9rem',
        lineHeight: 1.4,
        outline: 'none',
        boxSizing: 'border-box',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease',
        ...(style || {}),
      }}
    />
  )

  return (
    <div className={['ui-field', className].filter(Boolean).join(' ')} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      {label && (
        <label htmlFor={fieldId} style={{ fontSize: '0.76rem', fontWeight: 700, letterSpacing: '0.01em', color: 'var(--color-text-secondary)' }}>
          {label}
        </label>
      )}
      {hasPasswordToggle ? (
        <div className="ui-password-field">
          {input}
          <button
            type="button"
            className="ui-password-toggle"
            aria-label={passwordVisible ? 'Hide password' : 'Show password'}
            aria-pressed={passwordVisible}
            aria-controls={fieldId}
            onClick={() => setPasswordVisible((visible) => !visible)}
          >
            <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {passwordVisible ? (
                <>
                  <path d="M3 3l18 18" />
                  <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                  <path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c5 0 8.5 4.6 9.5 6.3a1.3 1.3 0 0 1 0 1.4 15 15 0 0 1-3 3.5" />
                  <path d="M6.2 6.2a15 15 0 0 0-3.7 5.1 1.3 1.3 0 0 0 0 1.4C3.5 14.4 7 19 12 19a10 10 0 0 0 3-.5" />
                </>
              ) : (
                <>
                  <path d="M2.5 12s3.4-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.4 6.5-9.5 6.5S2.5 12 2.5 12Z" />
                  <circle cx="12" cy="12" r="2.7" />
                </>
              )}
            </svg>
          </button>
        </div>
      ) : input}
      {helperText && !error && (
        <small style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', lineHeight: 1.4 }}>
          {helperText}
        </small>
      )}
      {error && (
        <small style={{ color: 'var(--color-danger)', fontSize: '0.75rem', lineHeight: 1.4 }}>
          {error}
        </small>
      )}
    </div>
  )
}

export default Input
