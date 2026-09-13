const variantStyles = {
  primary: {
    background: 'var(--color-accent)',
    color: '#fff',
    border: '1px solid var(--color-accent)',
    boxShadow: '0 2px 5px rgba(20, 70, 120, 0.16)',
  },
  secondary: {
    background: 'transparent',
    color: 'var(--color-text-primary)',
    border: '1px solid var(--color-border)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--color-text-primary)',
    border: '1px solid transparent',
  },
  danger: {
    background: 'var(--color-danger)',
    color: '#fff',
    border: '1px solid var(--color-danger)',
  },
}

const sizeStyles = {
  sm: { minHeight: '34px', padding: '0 var(--space-3)', fontSize: '0.78rem' },
  md: { minHeight: '40px', padding: '0 var(--space-4)', fontSize: '0.875rem' },
  lg: { minHeight: '48px', padding: '0 var(--space-5)', fontSize: '0.95rem' },
}

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  style,
  ...props
}) => {
  const mergedStyle = {
    ...baseStyle,
    ...variantStyles[variant],
    ...sizeStyles[size],
    ...(style || {}),
  }

  return (
    <button
      type={props.type || 'button'}
      className={['ui-button', className].filter(Boolean).join(' ')}
      style={mergedStyle}
      {...props}
    >
      {children}
    </button>
  )
}

const baseStyle = {
  display: 'inline-flex',
  flex: '0 0 auto',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 'var(--space-2)',
  borderRadius: 'var(--radius-md)',
  fontFamily: 'var(--font-family)',
  fontWeight: 600,
  lineHeight: 1.2,
  cursor: 'pointer',
  transition: 'background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease',
  whiteSpace: 'nowrap',
  textDecoration: 'none',
  boxSizing: 'border-box',
  userSelect: 'none',
}

export default Button
