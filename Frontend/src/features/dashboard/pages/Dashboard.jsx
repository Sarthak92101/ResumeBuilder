import React, { useEffect, useState } from 'react'
import AppNavbar from '../../../components/AppNavbar'
import { getInterviewStats } from '../../interview/services/interview.api'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Card, PageHeader, Badge, ProgressBar } from '../../../components/ui'

const Dashboard = () => {
  const [data, setData] = useState([])
  const [average, setAverage] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await getInterviewStats()
        const scores = (res.scores || []).map(s => ({
          date: new Date(s.createdAt).toLocaleDateString(),
          score: s.score ?? null
        }))
        setData(scores)
        setAverage(res.average)
      } catch (e) {
        console.error(e)
      }
    }
    load()
  }, [])

  return (
    <div className="page-shell">
      <AppNavbar />
      <main className="container">
        <PageHeader title="Progress Dashboard" subtitle="Track the quality of your interview preparation over time." />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
          <Card style={{ padding: 'var(--space-5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
              <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>Average Readiness</span>
              <Badge tone="accent">Live</Badge>
            </div>
            <div style={{ fontSize: '2.5rem', fontWeight: 700, lineHeight: 1 }}>{average !== null ? Math.round(average) : '—'}</div>
            <div style={{ marginTop: 'var(--space-3)' }}>
              <ProgressBar value={average ?? 0} max={100} tone={average >= 80 ? 'success' : average >= 60 ? 'warning' : 'danger'} />
            </div>
          </Card>

          <Card style={{ padding: 'var(--space-5)', minHeight: '260px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
              <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>Score Over Time</span>
            </div>
            <div style={{ width: '100%', height: '180px' }}>
              <ResponsiveContainer>
                <LineChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
                  <XAxis dataKey="date" stroke="var(--color-text-muted)" />
                  <YAxis domain={[0, 100]} stroke="var(--color-text-muted)" />
                  <Tooltip />
                  <Line type="monotone" dataKey="score" stroke="var(--color-accent)" strokeWidth={2} dot={{ r: 3, fill: 'var(--color-accent)' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}

export default Dashboard
