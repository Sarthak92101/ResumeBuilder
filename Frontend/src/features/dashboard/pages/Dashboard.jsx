import React, { useEffect, useState } from 'react'
import AppNavbar from '../../../components/AppNavbar'
import { getInterviewStats } from '../../interview/services/interview.api'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

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
    <div>
      <AppNavbar />
      <main className="container">
        <h1>Progress Dashboard</h1>
        <div className="dashboard-grid">
          <div className="card">
            <h3>Average Readiness</h3>
            <p className="avg-score">{average !== null ? Math.round(average) : '—'}</p>
          </div>
          <div className="card chart-card">
            <h3>Score Over Time</h3>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <LineChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="score" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Dashboard
