import { Link, useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "../features/auth/hooks/useAuth"
import { useContext } from "react"
import { ThemeContext } from "../features/theme/ThemeContext"
import "./AppNavbar.scss"

const AppNavbar = () => {
  const { user, handleLogout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { theme, toggle } = useContext(ThemeContext)

  const onLogout = async () => {
    await handleLogout()
    navigate("/login")
  }

  const linkClass = (path) =>
    `app-nav__link ${location.pathname === path ? "app-nav__link--active" : ""}`

  return (
    <header className="app-nav">
      <Link to="/" className="app-nav__brand">
        <span className="app-nav__logo">SM</span>
        <span>SkillMirror</span>
      </Link>

      <nav className="app-nav__links">
        <Link to="/" className={linkClass("/")}>
          Interview Plan
        </Link>
        <Link to="/dashboard" className={linkClass("/dashboard")}>
          Dashboard
        </Link>
        <Link to="/ats" className={linkClass("/ats")}>
          ATS Checker
        </Link>
        <Link to="/resumes" className={linkClass("/resumes")}>
          My Resumes
        </Link>
        <Link to="/gap-analysis" className={linkClass("/gap-analysis")}>
          Gap Analysis
        </Link>
        <Link to="/about" className={linkClass("/about")}>
          About Me
        </Link>
      </nav>

      <div className="app-nav__actions">
        <button type="button" className="theme-toggle" onClick={toggle} aria-label="Toggle theme">
          {theme === 'dark' ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          )}
        </button>
        {user ? (
          <>
            <span className="app-nav__user">Hi, {user.username}</span>
            <button type="button" className="button secondary-button" onClick={onLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="button secondary-button">
              Log in
            </Link>
            <Link to="/register" className="button primary-button">
              Sign up
            </Link>
          </>
        )}
      </div>
    </header>
  )
}

export default AppNavbar
