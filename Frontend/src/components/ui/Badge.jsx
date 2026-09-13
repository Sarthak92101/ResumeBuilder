const toneMap = {
  neutral: { background: 'var(--color-border)', color: 'var(--color-text-primary)' },
  success: { background: 'rgba(18, 184, 134, 0.12)', color: 'var(--color-success)' },
  warning: { background: 'rgba(245, 166, 35, 0.12)', color: 'var(--color-warning)' },
  danger: { background: 'rgba(229, 72, 77, 0.12)', color: 'var(--color-danger)' },
  accent: { background: 'var(--color-accent-soft)', color: 'var(--color-accent)' },
}

const Badge = ({ children, tone = 'neutral', className = '', style, ...props }) => (
  <span
    {...props}
    className={['ui-badge', className].filter(Boolean).join(' ')}
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '22px',
      padding: '0 var(--space-2)',
      borderRadius: '999px',
      fontSize: '0.7rem',
      fontWeight: 700,
      letterSpacing: '0.02em',
      border: '1px solid transparent',
      ...toneMap[tone],
      ...(style || {}),
    }}
  >
    {children}
  </span>
)

export default Badge
