import React, { useState, useEffect } from 'react'
import AppNavbar from '../../../components/AppNavbar'
import { listResumes } from '../../resume/services/resume.api'
import { getActiveResumeId, setActiveResumeId } from '../../resume/services/activeResume'
import { getGapAnalysis } from '../services/interview.api'
import { Card, PageHeader, Button, Textarea, Badge } from '../../../components/ui'
import ResumePicker from '../../resume/components/ResumePicker'
import { Link } from 'react-router-dom'
import '../../resume/pages/resume.scss'

const GapAnalysis = () => {
  const [resumes, setResumes] = useState([])
  const [resumesLoading, setResumesLoading] = useState(true)
  const [resumeUploading, setResumeUploading] = useState(false)
  const [resumeListError, setResumeListError] = useState('')
  const [resumeRetry, setResumeRetry] = useState(0)
  const [selectedResumeId, setSelectedResumeId] = useState(getActiveResumeId)
  const [jobDescription, setJobDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    async function load() {
      setResumesLoading(true)
      setResumeListError('')
      try {
        const res = await listResumes()
        if (cancelled) return
        const availableResumes = res.resumes || []
        setResumes(availableResumes)
        const preferred = availableResumes.find((resume) => resume._id === getActiveResumeId())
        const next = preferred || availableResumes[0]
        setSelectedResumeId(next?._id || '')
        if (next?._id) setActiveResumeId(next._id)
      } catch (error) {
        if (!cancelled) setResumeListError(error?.response?.data?.message || 'We couldn’t load your saved resumes.')
      } finally {
        if (!cancelled) setResumesLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [resumeRetry])

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
      <main className='container resume-tool-page' aria-busy={loading || resumesLoading || resumeUploading}>
        <PageHeader
          title='Resume-to-JD Gap Analysis'
          subtitle='See which skills are already supported by your resume, which may need clearer evidence, and which may need practice.'
          action={<Link to='/resumes' className='resume-tool-link'>Manage resumes <span aria-hidden='true'>→</span></Link>}
        />

        <Card className='resume-tool-card'>
          <form onSubmit={onSubmit} className='resume-tool-form'>
            {resumesLoading && <div className='resume-list-status' role='status'><span className='resume-tool-spinner' aria-hidden='true' /> Loading saved resumes…</div>}
            {resumeListError && <div className='resume-tool-error' role='alert'><span>{resumeListError}</span><Button type='button' variant='secondary' size='sm' onClick={() => setResumeRetry((key) => key + 1)}>Try again</Button></div>}
            {resumes.length === 0 && !resumesLoading && !resumeListError && (
              <div className='resume-tool-empty-hint'>
                <strong>Upload a resume to start</strong>
                <span>Choose “Upload a new CV” from the selector below, then compare it with the job description.</span>
              </div>
            )}
            <ResumePicker
              label='Select Resume'
              value={selectedResumeId}
              resumes={resumes}
              disabled={resumesLoading || loading}
              onUploadingChange={setResumeUploading}
              placeholder='Choose a CV'
              helperText='Your active CV is selected by default.'
              onChange={(resumeId) => {
                setSelectedResumeId(resumeId)
                setResult(null)
              }}
              onResumeUploaded={(resume) => setResumes((current) => [resume, ...current.filter((item) => item._id !== resume._id)])}
            />

            <Textarea label='Job Description' value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} rows={10} placeholder='Paste the full job description here...' />

            <div className='resume-tool-actions'>
              <Button type='submit' variant='primary' disabled={loading || resumesLoading || resumeUploading || !selectedResumeId}>{resumeUploading ? 'Saving CV…' : loading ? 'Analyzing…' : 'Analyze skill gaps'}{(loading || resumeUploading) && <span className='resume-tool-spinner' aria-hidden='true' />}</Button>
              <Button type='button' variant='secondary' disabled={loading || resumeUploading} onClick={() => { setResult(null); setJobDescription(''); setSelectedResumeId(''); setError(''); }}>Reset</Button>
            </div>
            {error && <div className='resume-tool-error' role='alert'><strong>We couldn’t analyze these skills.</strong><span>{error}</span></div>}
          </form>
        </Card>

        {result && (
          <Card className='resume-tool-card gap-results-card'>
            <div className='gap-results-heading'><div><span>YOUR ROLE MATCH</span><h2>Analysis results</h2></div><span>{(result.gaps || []).length} skills reviewed</span></div>
            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: 'var(--space-4)' }}>
              <Badge tone='success'>{(result.gaps || []).filter(g => g.status === 'Have').length} Already Have</Badge>
              <Badge tone='warning'>{(result.gaps || []).filter(g => g.status === 'Add to resume').length} Add to Resume</Badge>
              <Badge tone='danger'>{(result.gaps || []).filter(g => g.status === 'Learn').length} Need to Learn</Badge>
            </div>
            <div className='gap-table-wrap' role='region' aria-label='Skill gap results' tabIndex='0'>
            <table className='gap-results-table'>
              <thead>
                <tr>
                  <th>Skill</th>
                  <th>Status</th>
                  <th>Suggestion</th>
                </tr>
              </thead>
              <tbody>
                {(result.gaps || []).map((item, i) => {
                  return (
                    <tr key={i}>
                      <td>{item.skill}</td>
                      <td>
                        <Badge tone={item.status === 'Have' ? 'success' : item.status === 'Add to resume' ? 'warning' : 'danger'}>{item.status}</Badge>
                      </td>
                      <td>{item.suggestion}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            </div>
          </Card>
        )}
      </main>
    </div>
  )
}

export default GapAnalysis
