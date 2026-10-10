import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import AppNavbar from '../../../components/AppNavbar'
import { Badge, Button, Card, ProgressBar } from '../../../components/ui'
import { getInterviewStats } from '../../interview/services/interview.api'
import { useInterview } from '../../interview/hooks/useInterview'
import './dashboard.scss'

const QUICK_ACTIONS = [
  { path: '/', number: '01', title: 'Create interview plan', description: 'Match your experience to a role and build a focused roadmap.' },
  { path: '/ats', number: '02', title: 'Check resume fit', description: 'See how your resume aligns with a job description.' },
  { path: '/gap-analysis', number: '03', title: 'Review skill gaps', description: 'Find skills to highlight and areas to work on.' },
]

const Dashboard = () => {
  const [data, setData] = useState([])
  const [average, setAverage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retryKey, setRetryKey] = useState(0)
  const { reports } = useInterview()

  useEffect(() => {
    let cancelled = false

    async function loadStats() {
      setLoading(true)
      setError('')
      try {
        const response = await getInterviewStats()
        if (cancelled) return
        const scores = (response.scores || []).map((item) => ({
          date: new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          score: item.score ?? null,
        }))
        setData(scores)
        setAverage(response.average)
      } catch (loadError) {
        if (!cancelled) setError(loadError?.response?.data?.message || 'We couldn’t load your progress. Please try again.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadStats()
    return () => { cancelled = true }
  }, [retryKey])

  const latestReport = reports[0]
  const averageValue = average === null || average === undefined ? '—' : Math.round(average)

  return (
    <div className="page-shell dashboard-page">
      <AppNavbar />
      <main className="container dashboard-container">
        <header className="dashboard-header">
          <div>
            <span className="dashboard-eyebrow">YOUR WORKSPACE</span>
            <h1>Interview preparation, at a glance.</h1>
            <p>Review your preparation history and choose what to work on next.</p>
          </div>
          <Link to="/" className="dashboard-primary-link">Create interview plan <span aria-hidden="true">→</span></Link>
        </header>

        {error && (
          <div className="dashboard-error" role="alert">
            <span>{error}</span>
            <Button variant="secondary" size="sm" onClick={() => setRetryKey((key) => key + 1)}>Try again</Button>
          </div>
        )}

        <section className="dashboard-metrics" aria-label="Preparation summary">
          <Card className="dashboard-metric dashboard-metric--primary">
            <div className="dashboard-metric__top"><span>Average readiness</span><Badge tone="accent">AI estimate</Badge></div>
            <strong className="dashboard-metric__value">{loading ? '…' : averageValue}<small>{averageValue === '—' || loading ? '' : '/100'}</small></strong>
            <div className="dashboard-metric__progress"><ProgressBar value={average ?? 0} max={100} tone={average >= 80 ? 'success' : average >= 60 ? 'warning' : 'danger'} /></div>
            <span className="dashboard-metric__note">Based on your generated interview plans.</span>
          </Card>

          <Card className="dashboard-metric">
            <div className="dashboard-metric__top"><span>Interview plans</span><span className="dashboard-metric__icon" aria-hidden="true">▤</span></div>
            <strong className="dashboard-metric__value">{reports.length}</strong>
            <span className="dashboard-metric__note">Role-specific preparation reports saved to your workspace.</span>
          </Card>

          <Card className="dashboard-metric">
            <div className="dashboard-metric__top"><span>Most recent plan</span><span className="dashboard-metric__icon" aria-hidden="true">↗</span></div>
            {latestReport ? (
              <Link to={`/interview/${latestReport._id}`} className="dashboard-latest">
                <strong>{latestReport.title || 'Untitled position'}</strong>
                <span>{new Date(latestReport.createdAt).toLocaleDateString()}</span>
              </Link>
            ) : <strong className="dashboard-metric__empty">No plans yet</strong>}
            <span className="dashboard-metric__note">{latestReport ? 'Open your latest report and continue practicing.' : 'Create a plan to start tracking your preparation.'}</span>
          </Card>
        </section>

        <section className="dashboard-content-grid">
          <Card className="dashboard-chart-card">
            <div className="dashboard-section-heading">
              <div><span>PREPARATION TREND</span><h2>Readiness over time</h2></div>
              {data.length > 0 && <Badge tone="neutral">{data.length} {data.length === 1 ? 'report' : 'reports'}</Badge>}
            </div>
            {loading ? (
              <div className="dashboard-chart-state dashboard-chart-state--loading" role="status">
                <div className="dashboard-chart-loading" aria-hidden="true">
                  <svg viewBox="0 0 220 86" preserveAspectRatio="none">
                    <path d="M4 72 C34 68 43 45 72 52 S113 62 137 34 S179 45 216 10" />
                    <circle cx="72" cy="52" r="4" />
                    <circle cx="137" cy="34" r="4" />
                    <circle cx="216" cy="10" r="4" />
                  </svg>
                  <div className="dashboard-chart-loading__bars"><i /><i /><i /><i /><i /></div>
                </div>
                <strong>Drawing your readiness trend</strong>
                <p>Gathering scores from your recent interview plans.</p>
              </div>
            ) : data.length > 0 ? (
              <div className="dashboard-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data} margin={{ top: 12, right: 18, left: -16, bottom: 2 }}>
                    <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tickLine={false} axisLine={false} tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10, color: 'var(--color-text-primary)' }} />
                    <Line type="monotone" dataKey="score" name="Readiness" stroke="var(--color-accent)" strokeWidth={3} dot={{ r: 4, fill: 'var(--color-accent)', strokeWidth: 0 }} activeDot={{ r: 6 }} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="dashboard-chart-state dashboard-chart-state--empty">
                <span className="dashboard-empty-mark" aria-hidden="true">↗</span>
                <strong>Your trend will appear here</strong>
                <p>Create interview plans to see your AI-estimated readiness history.</p>
                <Link to="/">Create your first plan <span aria-hidden="true">→</span></Link>
              </div>
            )}
            <p className="dashboard-chart-disclaimer">Readiness is an AI-generated estimate from each report, not a mock interview score.</p>
          </Card>

          <Card className="dashboard-actions-card">
            <div className="dashboard-section-heading"><div><span>KEEP MOVING</span><h2>Next steps</h2></div></div>
            <div className="dashboard-action-list">
              {QUICK_ACTIONS.map((action) => (
                <Link key={action.path} to={action.path} className="dashboard-action">
                  <span className="dashboard-action__number">{action.number}</span>
                  <span className="dashboard-action__copy"><strong>{action.title}</strong><small>{action.description}</small></span>
                  <span className="dashboard-action__arrow" aria-hidden="true">→</span>
                </Link>
              ))}
            </div>
          </Card>
        </section>
      </main>
    </div>
  )
}

export default Dashboard
