import React, { useEffect, useState, useContext } from 'react'
import { Link } from 'react-router-dom'
import AppNavbar from '../../../components/AppNavbar'
import { listResumes, createAtsScore } from '../services/resume.api'
import { getActiveResumeId, setActiveResumeId } from '../services/activeResume'
import ResumePicker from '../components/ResumePicker'
import { ThemeContext } from '../../theme/ThemeContext'
import { Card, Button, Select, Textarea, PageHeader, Badge } from '../../../components/ui'
import './resume.scss'

const BREAKDOWN_ITEMS = [
  { name: 'Keyword match', key: 'keywordMatch' },
  { name: 'Formatting', key: 'formatting' },
  { name: 'Achievements', key: 'achievements' },
  { name: 'Action verbs', key: 'actionVerbs' },
  { name: 'Section completeness', key: 'sectionCompleteness' },
]

const AtsScoreChecker = () => {
  const { theme } = useContext(ThemeContext)
  const [resumes, setResumes] = useState([])
  const [resumesLoading, setResumesLoading] = useState(true)
  const [resumeUploading, setResumeUploading] = useState(false)
  const [resumeListError, setResumeListError] = useState('')
  const [resumeRetry, setResumeRetry] = useState(0)
  const [selected, setSelected] = useState(getActiveResumeId)
  const [jobDesc, setJobDesc] = useState('')
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
        setSelected(next?._id || '')
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

  const overallScore = Math.max(0, Math.min(100, Math.round(Number(result?.overallScore) || 0)))
  const scoreTone = overallScore >= 80 ? 'strong' : overallScore >= 60 ? 'moderate' : 'needs-work'
  const hasJobDescription = Boolean(jobDesc.trim())
  const scoreHeadline = hasJobDescription
    ? (scoreTone === 'strong' ? 'Strong role match' : scoreTone === 'moderate' ? 'Good starting point' : 'Room to improve')
    : (scoreTone === 'strong' ? 'Strong resume profile' : scoreTone === 'moderate' ? 'Good foundation' : 'Needs refinement')
  const scoreDescription = hasJobDescription
    ? 'This estimate compares your resume with the role description you provided.'
    : 'This estimate looks at general resume structure and content.'
  const selectedResume = resumes.find((resume) => resume._id === selected)

  return (
    <div className="page-shell">
      <AppNavbar />
      <main className={`container resume-tool-page ${theme === 'dark' ? 'theme-dark' : ''}`} aria-busy={loading || resumesLoading || resumeUploading}>
        <PageHeader
          title="ATS Score Checker"
          subtitle="See where your resume matches the role and what you could improve. Treat this score as guidance, not a hiring prediction."
          action={<Link to="/resumes" className="resume-tool-link">Manage resumes <span aria-hidden="true">→</span></Link>}
        />

        <div className={`ats-layout ${result ? 'ats-layout--with-breakdown' : ''}`}>
          <Card className="resume-tool-card ats-form-card">
            <form onSubmit={onSubmit} className="resume-tool-form">
              {resumesLoading && <div className="resume-list-status" role="status"><span className="resume-tool-spinner" aria-hidden="true" /> Loading saved resumes…</div>}
              {resumeListError && <div className="resume-tool-error" role="alert"><span>{resumeListError}</span><Button type="button" variant="secondary" size="sm" onClick={() => setResumeRetry((key) => key + 1)}>Try again</Button></div>}
              {resumes.length === 0 && !resumesLoading && !resumeListError && (
                <div className="resume-tool-empty-hint">
                  <strong>Upload a resume to get started</strong>
                  <span>Choose “Upload a new CV” from the selector below.</span>
                </div>
              )}
              <ResumePicker
                label="Select Resume"
                value={selected}
                resumes={resumes}
                disabled={loading || resumesLoading}
                onUploadingChange={setResumeUploading}
                placeholder="Choose a CV"
                helperText="Your active CV is selected by default."
                onChange={(resumeId) => {
                  setSelected(resumeId)
                  setResult(null)
                }}
                onResumeUploaded={(resume) => setResumes((current) => [resume, ...current.filter((item) => item._id !== resume._id)])}
              />
              {selectedResume?.confirmedInterviewAchievements?.length > 0 && (
                <p className="ats-interview-additions-note">This check includes your {selectedResume.confirmedInterviewAchievements.length} approved SAVIK interview {selectedResume.confirmedInterviewAchievements.length === 1 ? 'addition' : 'additions'}. Your uploaded PDF is unchanged.</p>
              )}

              <Textarea label="Job Description (optional)" value={jobDesc} disabled={loading} onChange={(e) => { setJobDesc(e.target.value); setResult(null) }} rows={8} placeholder="Paste the role description for a more targeted score..." />

              <div className="resume-tool-actions">
                <Button type="submit" variant="primary" disabled={loading || resumeUploading || !selected}>{resumeUploading ? 'Saving CV…' : loading ? 'Checking resume…' : 'Check ATS score'}{(loading || resumeUploading) && <span className="resume-tool-spinner" aria-hidden="true" />}</Button>
                <Button type="button" variant="secondary" onClick={() => { setJobDesc(''); setResult(null); setError('') }} disabled={loading || resumeUploading}>Reset</Button>
              </div>

              {error && <div className="resume-tool-error" role="alert"><strong>We couldn’t check this resume.</strong><span>{error}</span></div>}
            </form>
          </Card>

          <Card className="resume-tool-card ats-result-card">
            {!result && (
              <div className="ats-result-placeholder">
                <span className="ats-result-placeholder__icon" aria-hidden="true">%</span>
                <strong>{loading ? 'Checking your resume' : 'Your score will appear here'}</strong>
                <span>{loading ? 'Comparing resume content and structure with your selected role…' : 'Choose a resume and run the checker to see a score and suggestions.'}</span>
                {loading && <span className="resume-tool-spinner" aria-hidden="true" />}
              </div>
            )}

            {result && (
              <div className="ats-score-content">
                <div className="ats-result-heading">
                  <div><span>RESUME ANALYSIS</span><h2>Your ATS estimate</h2></div>
                  <Badge tone="neutral">Quick local estimate</Badge>
                </div>

                <div className={`ats-score-overview ats-score-overview--${scoreTone}`}>
                  <div
                    className="ats-score-gauge"
                    style={{ '--ats-progress': `${overallScore}%` }}
                    role="img"
                    aria-label={`ATS estimate: ${overallScore} out of 100`}
                  >
                    <div className="ats-score-gauge__center">
                      <strong>{overallScore}</strong>
                      <span>out of 100</span>
                    </div>
                  </div>
                  <div className="ats-score-summary">
                    <span className="ats-score-summary__label">{scoreHeadline}</span>
                    <p>{scoreDescription}</p>
                    <div className="ats-score-summary__keywords">
                      <strong>{hasJobDescription ? (result.missingKeywords || []).length : '—'}</strong>
                      <span>{hasJobDescription ? 'keywords to review' : 'add a role for keyword matching'}</span>
                    </div>
                  </div>
                </div>

                <section className="ats-result-section">
                  <div className="ats-result-section__heading">
                    <div><span>KEYWORD GAPS</span><h3>Terms to review</h3></div>
                    <span className="ats-result-section__count">{hasJobDescription ? (result.missingKeywords || []).length : '—'}</span>
                  </div>
                  {!hasJobDescription ? (
                    <p className="ats-result-empty">Add a job description to see role-specific keywords that may be missing.</p>
                  ) : (result.missingKeywords || []).length ? (
                    <div className="ats-keyword-list">
                      {result.missingKeywords.map((keyword, index) => <span key={`${keyword}-${index}`}>{keyword}</span>)}
                    </div>
                  ) : (
                    <p className="ats-result-empty">No missing keywords were identified for this analysis.</p>
                  )}
                </section>

                <section className="ats-result-section ats-result-section--suggestions">
                  <div className="ats-result-section__heading">
                    <div><span>NEXT STEPS</span><h3>Ways to strengthen your resume</h3></div>
                  </div>
                  {(result.suggestions || []).length ? (
                    <ul className="ats-suggestion-list">
                      {result.suggestions.map((suggestion, index) => <li key={`${suggestion}-${index}`}><span aria-hidden="true">↗</span><span>{suggestion}</span></li>)}
                    </ul>
                  ) : (
                    <p className="ats-result-empty">No specific changes to suggest from this analysis.</p>
                  )}
                </section>
              </div>
            )}
          </Card>
          {result && (
            <Card className="resume-tool-card ats-breakdown-card">
              <div className="ats-breakdown-heading">
                <div><span>SCORE DETAILS</span><h2>What shaped this estimate</h2></div>
                <p>Each area is scored from 0 to 100.</p>
              </div>
              <div className="ats-breakdown-list">
                {BREAKDOWN_ITEMS.map(({ name, key }) => {
                  const value = Math.max(0, Math.min(100, Math.round(Number(result.breakdown?.[key]) || 0)))
                  return (
                    <div className="ats-breakdown-item" key={key}>
                      <div className="ats-breakdown-item__heading"><strong>{name}</strong><span>{value}<small>/100</small></span></div>
                      <div className="ats-breakdown-item__track" role="meter" aria-label={`${name} score`} aria-valuemin="0" aria-valuemax="100" aria-valuenow={value}>
                        <span style={{ width: `${value}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}

export default AtsScoreChecker
