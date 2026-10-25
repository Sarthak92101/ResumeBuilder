import { NavLink, Link, useNavigate } from "react-router-dom"
import { useAuth } from "../features/auth/hooks/useAuth"
import { useContext, useState } from "react"
import { ThemeContext } from "../features/theme/ThemeContext"
import { Button } from './ui'
import SkillMirrorMark from './SkillMirrorMark'

const NAV_ITEMS = [
  { path: '/', label: 'Prepare', end: true },
  { path: '/dashboard', label: 'Progress' },
  { path: '/ats', label: 'ATS' },
  { path: '/ai-coach', label: 'SAVIK' },
  { path: '/resumes', label: 'Resumes' },
  { path: '/gap-analysis', label: 'Skills' },
]

const AppNavbar = () => {
  const { user, handleLogout } = useAuth()
  const navigate = useNavigate()
  const { theme, toggle } = useContext(ThemeContext)
  const [menuOpen, setMenuOpen] = useState(false)

  const onLogout = async () => {
    await handleLogout()
    navigate("/login")
  }

  return (
    <header className="app-navbar">
      <Link to="/" className="app-navbar__brand" onClick={() => setMenuOpen(false)}>
        <SkillMirrorMark className="app-navbar__mark" />
        <span className="app-navbar__brand-copy">
          <strong>SkillMirror</strong>
          <small>Interview prep for developers</small>
        </span>
      </Link>

      <button
        type="button"
        className="app-navbar__menu-toggle"
        aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={menuOpen}
        aria-controls="primary-navigation"
        onClick={() => setMenuOpen((open) => !open)}
      >
        <span />
        <span />
        <span />
      </button>

      <nav
        id="primary-navigation"
        className={`app-navbar__nav${menuOpen ? ' app-navbar__nav--open' : ''}`}
        aria-label="Main navigation"
      >
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            className={({ isActive }) => `app-navbar__link${isActive ? ' app-navbar__link--active' : ''}`}
            onClick={() => setMenuOpen(false)}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="app-navbar__actions">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggle}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          className="app-navbar__theme-toggle"
        >
          {theme === 'dark' ? '☀' : '☾'}
        </Button>

        {user ? (
          <>
            <span className="app-navbar__greeting">Hi, {user.username}</span>
            <Button variant="secondary" size="sm" onClick={onLogout}>Log out</Button>
          </>
        ) : (
          <>
            <Link to="/login" className="app-navbar__auth-link">Log in</Link>
            <Link to="/register" className="app-navbar__auth-link app-navbar__auth-link--primary">Sign up</Link>
          </>
        )}
      </div>
    </header>
  )
}

export default AppNavbar
