import { Link } from "react-router-dom"
import { ABOUT } from "../../../content/about"
import "../auth.form.scss"

const AuthLayout = ({ title, subtitle, children }) => {
  return (
    <div className="auth-page">
      <aside className="auth-about">
        <div className="auth-about__inner">
          <p className="auth-about__name">{ABOUT.name}</p>
          <p className="auth-about__role">{ABOUT.role}</p>
          <p className="auth-about__bio">{ABOUT.tagline}</p>

          <div className="auth-about__links">
            <a
              href={ABOUT.github.url}
              target="_blank"
              rel="noreferrer"
              className="auth-about__link"
            >
              GitHub · {ABOUT.github.username}
            </a>
            <a
              href={ABOUT.portfolio.url}
              target="_blank"
              rel="noreferrer"
              className="auth-about__link"
            >
              Portfolio · {ABOUT.portfolio.label}
            </a>
          </div>

          <Link to="/about" className="auth-about__more">
            More about me →
          </Link>
        </div>
      </aside>

      <section className="auth-form-side">
        <div className="auth-form-card">
          <div className="auth-form-card__head">
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          {children}
        </div>
      </section>
    </div>
  )
}

export default AuthLayout
