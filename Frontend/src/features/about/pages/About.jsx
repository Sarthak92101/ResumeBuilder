import { Link } from 'react-router-dom'
import AppNavbar from '../../../components/AppNavbar'
import { Card } from '../../../components/ui'
import './about.scss'

const VALUE_CARDS = [
  { number: '01', title: 'Start with your target role', description: 'Compare your resume and experience with the job you want, then see the skills the role asks for.' },
  { number: '02', title: 'Bring your real work', description: 'Use public coding profiles to make technical questions more relevant to your projects and practice history.' },
  { number: '03', title: 'Practice your answers', description: 'Work through coding, written, and voice practice with feedback and a short preparation roadmap.' },
]

const About = () => (
  <div className="page-shell about-page">
    <AppNavbar />
    <main className="container about-container">
      <section className="about-hero">
        <span className="about-eyebrow">ABOUT SKILLMIRROR</span>
        <h1>Interview prep grounded in your experience.</h1>
        <p>SkillMirror helps software engineering candidates prepare for a specific role using their resume, job description, projects, and coding profile.</p>
        <div className="about-hero__actions">
          <Link to="/register" className="about-primary-link">Create your plan <span aria-hidden="true">→</span></Link>
          <Link to="/login" className="about-secondary-link">Log in</Link>
        </div>
      </section>

      <section className="about-values" aria-label="How SkillMirror helps">
        {VALUE_CARDS.map((item) => (
          <Card key={item.number} className="about-value-card">
            <span>{item.number}</span>
            <h2>{item.title}</h2>
            <p>{item.description}</p>
          </Card>
        ))}
      </section>

      <Card className="about-workflow">
        <div><span className="about-eyebrow">THE WORKFLOW</span><h2>From role description to practice plan.</h2><p>Get job-specific questions, skill-gap guidance, a five-day roadmap, and tools to practice technical and spoken answers.</p></div>
        <div className="about-workflow__tags"><span>Resume + job description</span><b aria-hidden="true">→</b><span>Personalized questions</span><b aria-hidden="true">→</b><span>Practice + feedback</span></div>
      </Card>
    </main>
  </div>
)

export default About
