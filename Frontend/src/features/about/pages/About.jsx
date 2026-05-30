import { Link } from "react-router-dom"
import AppNavbar from "../../../components/AppNavbar"
import { ABOUT } from "../../../content/about"
import "../style/about.scss"

const About = () => {
  return (
    <div className="about-page">
      <AppNavbar />

      <main className="about-main">
        <section className="about-hero">
          <p className="about-hero__eyebrow">About me</p>

          <h1>
            <span className="highlight">{ABOUT.name}</span>
          </h1>

          <p className="about-hero__role">{ABOUT.role}</p>
          <p className="about-hero__lead">{ABOUT.tagline}</p>

         <div className="about-links">
  <a
    href={ABOUT.github.url}
    target="_blank"
    rel="noreferrer"
    className="about-link-card"
  >
    <h3 className="about-link-card__title">GitHub</h3>
    <p className="about-link-card__subtitle">
      View my repositories & contributions
    </p>
  </a>

  <a
    href={ABOUT.portfolio.url}
    target="_blank"
    rel="noreferrer"
    className="about-link-card"
  >
    <h3 className="about-link-card__title">Portfolio</h3>
    <p className="about-link-card__subtitle">
      Explore my projects & experience
    </p>
  </a>
</div>
        </section>

        <article className="about-card about-card--wide">
          <h2>This app</h2>

          <p>
            Upload your resume, add a job description, and get an
            AI-generated interview plan including personalized
            questions, skill-gap analysis, preparation roadmap,
            interview tips, and downloadable PDF reports.
          </p>

          <div className="about-cta">
            <Link to="/register" className="button primary-button">
              Create Account
            </Link>

            <Link to="/login" className="button secondary-button">
              Log In
            </Link>

            <Link to="/" className="button secondary-button">
              Dashboard
            </Link>
          </div>
        </article>
      </main>
    </div>
  )
}

export default About