import { Link } from "react-router-dom"
import "../auth.form.scss"

const AuthLayout = ({ title, subtitle, children }) => {
  return (
    <div className="auth-page">
      <div className="auth-form-card">
        <div className="auth-form-card__brand">
          <Link to="/" className="auth-form-card__logo">
            IQ
          </Link>
          <span className="auth-form-card__app-name">InterviewIq</span>
        </div>

        <div className="auth-form-card__head">
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>

        {children}
      </div>
    </div>
  )
}

export default AuthLayout
