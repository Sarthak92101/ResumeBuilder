const Card = ({ children, className = '', interactive = false, style, ...props }) => (
  <div
    {...props}
    className={['ui-card', interactive ? 'ui-card--interactive' : '', className].filter(Boolean).join(' ')}
    style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-md)',
      color: 'var(--color-text-primary)',
      transition: 'border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease',
      ...(interactive
        ? {
            boxShadow: '0 0 0 0 rgba(0,0,0,0)',
            cursor: 'pointer',
          }
        : {}),
      ...(style || {}),
    }}
  >
    {children}
  </div>
)

export default Card
