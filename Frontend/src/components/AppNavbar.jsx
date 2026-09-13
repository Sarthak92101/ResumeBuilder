import { Link, useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "../features/auth/hooks/useAuth"
import { useContext } from "react"
import { ThemeContext } from "../features/theme/ThemeContext"
import { Button } from './ui'

const AppNavbar = () => {
  const { user, handleLogout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { theme, toggle } = useContext(ThemeContext)

  const onLogout = async () => {
    await handleLogout()
    navigate("/login")
  }

  const navItems = [
    { path: '/', label: 'Interview Plan' },
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/ats', label: 'ATS Checker' },
    { path: '/resumes', label: 'My Resumes' },
    { path: '/gap-analysis', label: 'Gap Analysis' },
    { path: '/about', label: 'About Me' },
  ]

  const isActive = (path) => location.pathname === path

  return (
    <header className="app-navbar" style={{
      width: 'min(calc(100% - var(--space-6)), 1180px)',
      margin: '0 auto',
      padding: 'var(--space-3) var(--space-4)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 'var(--space-3)',
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-lg)',
      position: 'sticky',
      top: 'var(--space-3)',
      zIndex: 20,
      marginTop: 'var(--space-3)',
    }}>
      <Link to="/" style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
        textDecoration: 'none',
        color: 'var(--color-text-primary)',
        fontWeight: 700,
      }}>
        <span style={{
          width: '28px',
          height: '28px',
          display: 'grid',
          placeItems: 'center',
          borderRadius: 'var(--radius-sm)',
          background: 'var(--color-accent)',
          color: 'var(--color-surface)',
          fontSize: '0.7rem',
        }}>SM</span>
        <span>SkillMirror</span>
      </Link>

      <nav className="app-navbar__nav" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', flex: 1, justifyContent: 'center', overflowX: 'auto' }}>
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            style={{
              textDecoration: 'none',
              color: isActive(item.path) ? 'var(--color-accent)' : 'var(--color-text-secondary)',
              background: isActive(item.path) ? 'var(--color-accent-soft)' : 'transparent',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-2) var(--space-3)',
              fontSize: '0.8rem',
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="app-navbar__actions" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        <Button variant="ghost" size="sm" onClick={toggle} aria-label="Toggle theme" style={{ minWidth: '36px', padding: '0 var(--space-2)' }}>
          {theme === 'dark' ? '☀' : '☾'}
        </Button>

        {user ? (
          <>
            <span className="app-navbar__greeting" style={{ fontSize: '0.76rem', color: 'var(--color-text-secondary)' }}>Hi, {user.username}</span>
            <Button variant="secondary" size="sm" onClick={onLogout}>Logout</Button>
          </>
        ) : (
          <>
            <Link to="/login" style={{ textDecoration: 'none' }}><Button variant="secondary" size="sm">Log in</Button></Link>
            <Link to="/register" style={{ textDecoration: 'none' }}><Button variant="primary" size="sm">Sign up</Button></Link>
          </>
        )}
      </div>
    </header>
  )
}

export default AppNavbar
