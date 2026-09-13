import Button from './Button'

const EmptyState = ({ title, description, actionLabel, onAction, icon, className = '' }) => (
  <div
    className={['ui-empty-state', className].filter(Boolean).join(' ')}
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      gap: 'var(--space-4)',
      padding: 'var(--space-8)',
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-lg)',
      color: 'var(--color-text-primary)',
    }}
  >
    {icon && (
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--color-accent-soft)',
          display: 'grid',
          placeItems: 'center',
          color: 'var(--color-accent)',
        }}
      >
        {icon}
      </div>
    )}
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', maxWidth: '420px' }}>
      <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{title}</h3>
      {description && (
        <p style={{ margin: 0, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{description}</p>
      )}
    </div>
    {actionLabel && (
      <Button variant="primary" onClick={onAction}>
        {actionLabel}
      </Button>
    )}
  </div>
)

export default EmptyState
