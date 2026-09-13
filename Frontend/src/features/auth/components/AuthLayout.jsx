import { Link } from "react-router-dom"

const AuthLayout = ({ title, subtitle, children }) => {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 'var(--space-7) var(--space-4)' }}>
      <div style={{ width: 'min(100%, 440px)', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-7)', boxShadow: '0 24px 50px rgba(15, 23, 42, 0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-6)' }}>
          <Link to="/" style={{ width: '32px', height: '32px', display: 'grid', placeItems: 'center', borderRadius: 'var(--radius-sm)', background: 'var(--color-accent)', color: 'var(--color-surface)', textDecoration: 'none', fontWeight: 700 }}>
            SM
          </Link>
          <span style={{ color: 'var(--color-text-primary)', fontWeight: 700 }}>SkillMirror</span>
        </div>

        <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
          <h2 style={{ margin: 0, color: 'var(--color-text-primary)', fontSize: 'clamp(1.6rem, 2vw, 2.1rem)' }}>{title}</h2>
          {subtitle && <p style={{ margin: 'var(--space-2) 0 0', color: 'var(--color-text-secondary)' }}>{subtitle}</p>}
        </div>

        {children}
      </div>
    </div>
  )
}

export default AuthLayout
