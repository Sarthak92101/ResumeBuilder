import { Link } from "react-router-dom"
import AppNavbar from "../../../components/AppNavbar"
import { Card, Button, PageHeader } from "../../../components/ui"

const About = () => {
  return (
    <div className="page-shell">
      <AppNavbar />

      <main className="container">
        <PageHeader title="About SkillMirror" subtitle="A practical AI-powered interview preparation workflow for software engineers." />

        <Card style={{ padding: 'var(--space-6)' }}>
          <p style={{ margin: '0 0 var(--space-3)', color: 'var(--color-accent)', fontWeight: 700 }}>AI Interview Preparation Tool</p>
          <p style={{ margin: 0, lineHeight: 1.7, color: 'var(--color-text-secondary)' }}>
            Upload your resume, add a job description, and get a tailored interview plan with personalized questions, skill-gap analysis, roadmap guidance, and downloadable reports.
          </p>

          <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', marginTop: 'var(--space-5)' }}>
            <Link to="/register" style={{ textDecoration: 'none' }}><Button variant="primary">Create Account</Button></Link>
            <Link to="/login" style={{ textDecoration: 'none' }}><Button variant="secondary">Log In</Button></Link>
            <Link to="/dashboard" style={{ textDecoration: 'none' }}><Button variant="ghost">Dashboard</Button></Link>
          </div>
        </Card>
      </main>
    </div>
  )
}

export default About