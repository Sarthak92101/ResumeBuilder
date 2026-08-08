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
            <span className="highlight">Resume Maker</span>
          </h1>

          <p className="about-hero__role">AI Interview Preparation Tool</p>
          <p className="about-hero__lead">Upload your resume and job description to generate a personalized interview strategy.</p>
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