import { Link } from "react-router-dom"
import SkillMirrorMark from '../../../components/SkillMirrorMark'

const AuthLayout = ({ title, subtitle, children }) => {
  return (
    <div className="auth-shell" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 'var(--space-7) var(--space-4)' }}>
      <div className="auth-card" style={{ width: 'min(100%, 440px)', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-7)', boxShadow: '0 24px 50px rgba(15, 23, 42, 0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-6)' }}>
          <Link to="/" className="auth-brand-link" aria-label="SkillMirror home">
            <SkillMirrorMark className="auth-brand-mark" />
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
