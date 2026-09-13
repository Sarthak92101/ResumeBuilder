import React, { useState, useEffect } from 'react'
import AppNavbar from '../../../components/AppNavbar'
import { listResumes } from '../../resume/services/resume.api'
import { getGapAnalysis } from '../services/interview.api'
import { Card, PageHeader, Button, Select, Textarea, Badge } from '../../../components/ui'

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
    <div className='page-shell'>
      <AppNavbar />
      <main className='container'>
        <PageHeader title='Resume-to-JD Gap Analysis' subtitle='Discover which skills you already have, which to add to your resume, and which to learn.' />

        <Card style={{ padding: 'var(--space-5)' }}>
          <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <Select label='Select Resume (upload first in My Resumes)' value={selectedResumeId} onChange={(e) => setSelectedResumeId(e.target.value)}>
              <option value=''>-- choose --</option>
              {resumes.map(r => (
                <option key={r._id} value={r._id}>{r.fileName} — {new Date(r.createdAt).toLocaleDateString()}</option>
              ))}
            </Select>

            <Textarea label='Job Description' value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} rows={10} placeholder='Paste the full job description here...' />

            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              <Button type='submit' variant='primary' disabled={loading}>{loading ? 'Analyzing...' : 'Run Gap Analysis'}</Button>
              <Button type='button' variant='secondary' onClick={() => { setResult(null); setJobDescription(''); setSelectedResumeId(''); setError(''); }}>Reset</Button>
            </div>
            {error && <div style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', background: 'rgba(229,72,77,0.08)', color: 'var(--color-danger)', border: '1px solid rgba(229,72,77,0.2)' }}>{error}</div>}
          </form>
        </Card>

        {result && (
          <Card style={{ marginTop: 'var(--space-5)', padding: 'var(--space-5)' }}>
            <h2 style={{ marginTop: 0 }}>Analysis Results</h2>
            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: 'var(--space-4)' }}>
              <Badge tone='success'>{(result.gaps || []).filter(g => g.status === 'Have').length} Already Have</Badge>
              <Badge tone='warning'>{(result.gaps || []).filter(g => g.status === 'Add to resume').length} Add to Resume</Badge>
              <Badge tone='danger'>{(result.gaps || []).filter(g => g.status === 'Learn').length} Need to Learn</Badge>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: 'var(--space-2) 0', color: 'var(--color-text-secondary)' }}>Skill</th>
                  <th style={{ textAlign: 'left', padding: 'var(--space-2) 0', color: 'var(--color-text-secondary)' }}>Status</th>
                  <th style={{ textAlign: 'left', padding: 'var(--space-2) 0', color: 'var(--color-text-secondary)' }}>Suggestion</th>
                </tr>
              </thead>
              <tbody>
                {(result.gaps || []).map((item, i) => {
                  const colors = STATUS_COLORS[item.status] || STATUS_COLORS['Learn']
                  return (
                    <tr key={i}>
                      <td style={{ borderTop: '1px solid var(--color-border)', padding: 'var(--space-3) 0', color: 'var(--color-text-primary)' }}>{item.skill}</td>
                      <td style={{ borderTop: '1px solid var(--color-border)', padding: 'var(--space-3) 0' }}>
                        <Badge tone={item.status === 'Have' ? 'success' : item.status === 'Add to resume' ? 'warning' : 'danger'}>{item.status}</Badge>
                      </td>
                      <td style={{ borderTop: '1px solid var(--color-border)', padding: 'var(--space-3) 0', color: 'var(--color-text-secondary)' }}>{item.suggestion}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </Card>
        )}
      </main>
    </div>
  )
}

export default GapAnalysis
