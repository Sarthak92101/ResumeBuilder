import React, { useState, useEffect } from 'react'
import AppNavbar from '../../../components/AppNavbar'
import { listResumes } from '../../resume/services/resume.api'
import { getGapAnalysis } from '../services/interview.api'
import '../style/gap.scss'

const STATUS_COLORS = {
  'Have': { bg: 'rgba(52, 211, 153, 0.12)', color: '#34d399', border: 'rgba(52, 211, 153, 0.25)' },
  'Add to resume': { bg: 'rgba(251, 191, 36, 0.12)', color: '#fbbf24', border: 'rgba(251, 191, 36, 0.25)' },
  'Learn': { bg: 'rgba(248, 113, 113, 0.12)', color: '#f87171', border: 'rgba(248, 113, 113, 0.25)' },
}

const GapAnalysis = () => {
  const [resumes, setResumes] = useState([])
  const [selectedResumeId, setSelectedResumeId] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const res = await listResumes()
        setResumes(res.resumes || [])
      } catch (e) {
        console.error(e)
      }
    }
    load()
  }, [])

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!selectedResumeId) { setError('Please select a resume'); return }
    if (!jobDescription.trim()) { setError('Please enter a job description'); return }

    setLoading(true)
    setResult(null)
    setError('')
    try {
      const res = await getGapAnalysis({ resumeId: selectedResumeId, jobDescription })
      setResult(res.analysis)
    } catch (err) {
      console.error(err)
      setError(err?.response?.data?.message || err.message || 'Error running gap analysis')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <AppNavbar />
      <main className='container gap-page'>
        <header className='gap-header'>
          <h1>Resume-to-JD Gap Analysis</h1>
          <p>Discover which skills you already have, which to add to your resume, and which to learn.</p>
        </header>

        <form onSubmit={onSubmit} className='gap-form'>
          <div className='gap-form-grid'>
            <label className='gap-field'>
              <span>Select Resume (upload first in My Resumes)</span>
              <select value={selectedResumeId} onChange={(e) => setSelectedResumeId(e.target.value)}>
                <option value=''>-- choose --</option>
                {resumes.map(r => (
                  <option key={r._id} value={r._id}>{r.fileName} — {new Date(r.createdAt).toLocaleDateString()}</option>
                ))}
              </select>
            </label>

            <label className='gap-field'>
              <span>Job Description</span>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                rows={10}
                placeholder='Paste the full job description here...'
              />
            </label>
          </div>

          <div className='gap-actions'>
            <button type='submit' className='button primary-button' disabled={loading}>
              {loading ? 'Analyzing...' : 'Run Gap Analysis'}
            </button>
            <button type='button' className='button secondary-button' onClick={() => { setResult(null); setJobDescription(''); setSelectedResumeId(''); setError(''); }}>
              Reset
            </button>
          </div>
          {error && <div className='gap-error'>{error}</div>}
        </form>

        {result && (
          <div className='gap-results'>
            <h2>Analysis Results</h2>
            <div className='gap-results__summary'>
              <span className='gap-count gap-count--have'>{(result.gaps || []).filter(g => g.status === 'Have').length} Already Have</span>
              <span className='gap-count gap-count--add'>{(result.gaps || []).filter(g => g.status === 'Add to resume').length} Add to Resume</span>
              <span className='gap-count gap-count--learn'>{(result.gaps || []).filter(g => g.status === 'Learn').length} Need to Learn</span>
            </div>
            <table className='gap-table'>
              <thead>
                <tr>
                  <th>Skill</th>
                  <th>Status</th>
                  <th>Suggestion</th>
                </tr>
              </thead>
              <tbody>
                {(result.gaps || []).map((item, i) => {
                  const colors = STATUS_COLORS[item.status] || STATUS_COLORS['Learn']
                  return (
                    <tr key={i}>
                      <td className='gap-table__skill'>{item.skill}</td>
                      <td>
                        <span className='gap-status-badge' style={{ background: colors.bg, color: colors.color, borderColor: colors.border }}>
                          {item.status}
                        </span>
                      </td>
                      <td className='gap-table__suggestion'>{item.suggestion}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}

export default GapAnalysis
