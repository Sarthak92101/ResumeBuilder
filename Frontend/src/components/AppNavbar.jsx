import { Link, useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "../features/auth/hooks/useAuth"
import "./AppNavbar.scss"

const AppNavbar = () => {
  const { user, handleLogout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const onLogout = async () => {
    await handleLogout()
    navigate("/login")
  }

  const linkClass = (path) =>
    `app-nav__link ${location.pathname === path ? "app-nav__link--active" : ""}`

  return (
    <header className="app-nav">
      <Link to="/" className="app-nav__brand">
        <span className="app-nav__logo">SS</span>
        <span>Sarthak Sharma</span>
      </Link>

      <nav className="app-nav__links">
        <Link to="/" className={linkClass("/")}>
          Interview Plan
        </Link>
        <Link to="/about" className={linkClass("/about")}>
          About Me
        </Link>
      </nav>

      <div className="app-nav__actions">
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
