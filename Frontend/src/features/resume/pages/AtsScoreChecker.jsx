import React, { useEffect, useState, useContext } from 'react'
import AppNavbar from '../../../components/AppNavbar'
import { listResumes, createAtsScore } from '../services/resume.api'
import { ThemeContext } from '../../theme/ThemeContext'
import { RadialBarChart, RadialBar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { Card, Button, Select, Textarea, PageHeader, Badge } from '../../../components/ui'

const AtsScoreChecker = () => {
  const { theme } = useContext(ThemeContext)
  const [resumes, setResumes] = useState([])
  const [selected, setSelected] = useState('')
  const [jobDesc, setJobDesc] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const res = await listResumes()
        setResumes(res.resumes || [])
        if ((res.resumes || []).length) setSelected(res.resumes[0]._id)
      } catch (e) {
        console.error(e)
      }
    }
    load()
  }, [])

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!selected) return
    setLoading(true)
    setResult(null)
    setError('')
    try {
      const res = await createAtsScore(selected, jobDesc)
      setResult(res.score || res)
    } catch (err) {
      console.error(err)
      const msg = err?.response?.data?.message || err.message || 'Error'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const breakdownData = result ? [
    { name: 'Keyword Match', value: result.breakdown?.keywordMatch ?? 0 },
    { name: 'Formatting', value: result.breakdown?.formatting ?? 0 },
    { name: 'Achievements', value: result.breakdown?.achievements ?? 0 },
    { name: 'Action Verbs', value: result.breakdown?.actionVerbs ?? 0 },
    { name: 'Sections', value: result.breakdown?.sectionCompleteness ?? 0 },
  ] : []

  return (
    <div className="page-shell">
      <AppNavbar />
      <main className={`container ${theme === 'dark' ? 'theme-dark' : ''}`}>
        <PageHeader title="ATS Score Checker" subtitle="Measure how well your resume aligns with a target role and job description." />

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(280px, 0.8fr)', gap: 'var(--space-4)', alignItems: 'start' }}>
          <Card style={{ padding: 'var(--space-5)' }}>
            <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <Select label="Select Resume" value={selected} onChange={(e) => setSelected(e.target.value)}>
                <option value="">-- choose --</option>
                {resumes.map(r => (
                  <option key={r._id} value={r._id}>{r.fileName} — {new Date(r.createdAt).toLocaleDateString()}</option>
                ))}
              </Select>

              <Textarea label="Job Description (optional)" value={jobDesc} onChange={(e) => setJobDesc(e.target.value)} rows={8} />

              <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                <Button type="submit" variant="primary" disabled={loading}>{loading ? 'Checking…' : 'Check ATS Score'}</Button>
                <Button type="button" variant="secondary" onClick={() => { setJobDesc(''); setResult(null); setError('') }} disabled={loading}>Reset</Button>
              </div>

              {error && <div style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', background: 'rgba(229,72,77,0.08)', color: 'var(--color-danger)', border: '1px solid rgba(229,72,77,0.2)' }}>{error}</div>}
            </form>
          </Card>

          <Card style={{ padding: 'var(--space-5)', minHeight: '220px' }}>
            {!result && (
              <div style={{ color: 'var(--color-text-secondary)' }}>Results will appear here after running the checker.</div>
            )}

            {result && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
                  <h3 style={{ margin: 0 }}>Overall Score</h3>
                  <Badge tone={Number(result.overallScore) >= 80 ? 'success' : Number(result.overallScore) >= 60 ? 'warning' : 'danger'}>{Number(result.overallScore || 0)}</Badge>
                </div>

                <div style={{ width: '100%', height: 180, position: 'relative' }}>
                  <ResponsiveContainer>
                    <RadialBarChart innerRadius="80%" outerRadius="100%" data={[{ name: 'score', value: Number(result.overallScore) || 0 }]} startAngle={180} endAngle={-180}>
                      <RadialBar minAngle={15} background clockWise={false} dataKey="value" fill="var(--color-accent)" />
                    </RadialBarChart>
                  </ResponsiveContainer>
                </div>

                <h4 style={{ marginBottom: 'var(--space-2)' }}>Missing Keywords</h4>
                <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: 'var(--space-4)' }}>
                  {(result.missingKeywords || []).length ? result.missingKeywords.map((k, i) => (
                    <Badge key={i} tone="neutral">{k}</Badge>
                  )) : <span style={{ color: 'var(--color-text-secondary)' }}>None detected</span>}
                </div>

                <h4 style={{ marginBottom: 'var(--space-2)' }}>Suggestions</h4>
                <ul style={{ margin: 0, paddingLeft: 'var(--space-4)', color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
                  {(result.suggestions || []).length ? result.suggestions.map((s, i) => (<li key={i}>{s}</li>)) : <li>No suggestions</li>}
                </ul>
              </div>
            )}
          </Card>
        </div>

        {result && (
          <Card style={{ marginTop: 'var(--space-4)', padding: 'var(--space-5)' }}>
            <h3 style={{ marginTop: 0 }}>Breakdown</h3>
            <div style={{ width: '100%', height: 240 }}>
              <ResponsiveContainer>
                <BarChart data={breakdownData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                  <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
                  <XAxis dataKey="name" stroke="var(--color-text-muted)" />
                  <YAxis domain={[0, 100]} stroke="var(--color-text-muted)" />
                  <Tooltip />
                  <Bar dataKey="value" fill="var(--color-accent)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}
      </main>
    </div>
  )
}

export default AtsScoreChecker
