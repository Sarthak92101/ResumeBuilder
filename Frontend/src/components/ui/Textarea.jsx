const Textarea = ({
  label,
  helperText,
  error,
  className = '',
  id,
  style,
  ...props
}) => {
  const fieldId = id || label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className={['ui-field', className].filter(Boolean).join(' ')} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      {label && (
        <label htmlFor={fieldId} style={{ fontSize: '0.76rem', fontWeight: 700, letterSpacing: '0.01em', color: 'var(--color-text-secondary)' }}>
          {label}
        </label>
      )}
      <textarea
        id={fieldId}
        className="ui-control"
        aria-invalid={Boolean(error)}
        {...props}
        style={{
          width: '100%',
          minHeight: '112px',
          background: 'var(--color-input)',
          color: 'var(--color-text-primary)',
          border: `1px solid ${error ? 'var(--color-danger)' : 'var(--color-border)'}`,
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-4)',
          fontFamily: 'var(--font-family)',
          fontSize: '0.9rem',
          lineHeight: 1.55,
          resize: 'vertical',
          outline: 'none',
          boxSizing: 'border-box',
          transition: 'border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease',
          ...(style || {}),
        }}
      />
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

export default Textarea
