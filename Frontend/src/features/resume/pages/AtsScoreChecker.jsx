import React, { useEffect, useState, useContext } from 'react'
import AppNavbar from '../../../components/AppNavbar'
import { listResumes, createAtsScore, getAtsScores } from '../services/resume.api'
import { ThemeContext } from '../../theme/ThemeContext'
import { RadialBarChart, RadialBar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'

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
    <div>
      <AppNavbar />
      <main className={`container ${theme === 'dark' ? 'theme-dark' : ''}`}>
        <h1>ATS Score Checker</h1>
        <div className="card" style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: 20, alignItems: 'start' }}>
          <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <label style={{ display: 'flex', flexDirection: 'column' }}>
              Select Resume
              <select value={selected} onChange={(e) => setSelected(e.target.value)}>
                <option value="">-- choose --</option>
                {resumes.map(r => (
                  <option key={r._id} value={r._id}>{r.fileName} — {new Date(r.createdAt).toLocaleDateString()}</option>
                ))}
              </select>
            </label>

            <label style={{ display: 'flex', flexDirection: 'column' }}>
              Job Description (optional)
              <textarea
                value={jobDesc}
                onChange={(e) => setJobDesc(e.target.value)}
                rows={8}
                style={{ background: 'var(--panel)', color: 'var(--text)', border: '1px solid rgba(255,255,255,0.06)', padding: 12, borderRadius: 8 }}
              />
            </label>

            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" className="button primary-button" disabled={loading}>{loading ? 'Checking…' : 'Check ATS Score'}</button>
              <button type="button" className="button" onClick={() => { setJobDesc(''); setResult(null); setError('') }} disabled={loading}>Reset</button>
            </div>

            {error && <div style={{ marginTop: 8 }} className="error">{error}</div>}
          </form>

          <div style={{ minHeight: 220 }}>
            {!result && (
              <div style={{ color: 'var(--muted, #9ca3af)' }}>Results will appear here after running the checker.</div>
            )}

            {result && (
              <div>
                <h3 style={{ marginTop: 0 }}>Overall Score</h3>
                <div style={{ width: '100%', height: 180, position: 'relative' }}>
                  <ResponsiveContainer>
                    <RadialBarChart innerRadius="80%" outerRadius="100%" data={[{ name: 'score', value: Number(result.overallScore) || 0 }]} startAngle={180} endAngle={-180}>
                      <RadialBar minAngle={15} background clockWise={false} dataKey="value" fill="#8b5cf6" />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                    <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text)' }}>{Number(result.overallScore || 0)}</div>
                  </div>
                </div>

                <h4 style={{ marginBottom: 6 }}>Missing Keywords</h4>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                  {(result.missingKeywords || []).length ? result.missingKeywords.map((k, i) => (
                    <span key={i} className="chip">{k}</span>
                  )) : <em>None detected</em>}
                </div>

                <h4 style={{ marginBottom: 6 }}>Suggestions</h4>
                <ul>
                  {(result.suggestions || []).length ? result.suggestions.map((s, i) => (<li key={i}>{s}</li>)) : <li>No suggestions</li>}
                </ul>
              </div>
            )}
          </div>
        </div>

        {result && (
          <div className="card" style={{ marginTop: 16 }}>
            <h3>Breakdown</h3>
            <div style={{ width: '100%', height: 240 }}>
              <ResponsiveContainer>
                <BarChart data={breakdownData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#60a5fa" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default AtsScoreChecker
