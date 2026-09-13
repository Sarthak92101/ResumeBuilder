const PageHeader = ({ title, subtitle, action, className = '' }) => (
  <header
    className={['ui-page-header', className].filter(Boolean).join(' ')}
    style={{
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      gap: 'var(--space-4)',
      marginBottom: 'var(--space-6)',
      paddingTop: 'var(--space-2)',
      flexWrap: 'wrap',
    }}
  >
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      <h1 style={{ margin: 0, fontSize: 'clamp(1.8rem, 2.4vw, 2.6rem)', lineHeight: 1.1, color: 'var(--color-text-primary)' }}>{title}</h1>
      {subtitle && (
        <p style={{ margin: 0, color: 'var(--color-text-secondary)', maxWidth: '640px', lineHeight: 1.6 }}>
          {subtitle}
        </p>
      )}
    </div>
    {action && <div>{action}</div>}
  </header>
)

export default PageHeader
