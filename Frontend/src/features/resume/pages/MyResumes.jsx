import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AppNavbar from '../../../components/AppNavbar'
import { Button, Card, EmptyState, PageHeader } from '../../../components/ui'
import { listResumes, uploadResume } from '../services/resume.api'
import './resume.scss'

const MyResumes = () => {
  const [resumes, setResumes] = useState([])
  const [pageLoading, setPageLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [listError, setListError] = useState('')
  const [uploadError, setUploadError] = useState('')
  const [uploadSuccess, setUploadSuccess] = useState('')
  const [copiedResumeId, setCopiedResumeId] = useState('')
  const fileInputRef = useRef(null)
  const navigate = useNavigate()

  const loadResumes = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setPageLoading(true)
    setListError('')
    try {
      const response = await listResumes()
      setResumes(response.resumes || [])
    } catch (error) {
      setListError(error?.response?.data?.message || 'We couldn’t load your resumes. Please try again.')
    } finally {
      if (!silent) setPageLoading(false)
    }
  }, [])

  useEffect(() => { loadResumes() }, [loadResumes])

  const onUpload = async (event) => {
    const input = event.target
    const file = input.files?.[0]
    if (!file) return
    setUploadError('')
    setUploadSuccess('')

    if (file.type !== 'application/pdf' && !/\.pdf$/i.test(file.name)) {
      setUploadError('Please choose a PDF file.')
      input.value = ''
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('This file is over the 5 MB limit. Choose a smaller PDF.')
      input.value = ''
      return
    }

    setUploading(true)
    try {
      await uploadResume(file)
      await loadResumes({ silent: true })
      setUploadSuccess(`${file.name} is ready to use in an interview plan.`)
    } catch (error) {
      setUploadError(error?.response?.data?.message || 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
      input.value = ''
    }
  }

  const selectResume = (resume) => {
    navigate('/', { state: { resumeId: resume._id, fileName: resume.fileName } })
  }

  const copyResumeAdditions = async (resume) => {
    const additions = (resume.confirmedInterviewAchievements || []).map((item) => `• ${item.text}`).join('\n')
    try {
      await navigator.clipboard.writeText(additions)
      setCopiedResumeId(resume._id)
    } catch {
      setCopiedResumeId('')
    }
  }

  return (
    <div className="page-shell">
      <AppNavbar />
      <main className="container resume-tool-page resumes-page" aria-busy={pageLoading || uploading}>
        <PageHeader
          title="My Resumes"
          subtitle="Save your PDFs and review resume additions you approved after a Mira interview."
          action={(
            <label className="resume-upload-button">
              <input ref={fileInputRef} type="file" accept="application/pdf,.pdf" onChange={onUpload} disabled={uploading} />
              <Button variant="primary" disabled={uploading}>{uploading ? 'Uploading…' : 'Upload PDF'}{uploading && <span className="resume-tool-spinner" aria-hidden="true" />}</Button>
            </label>
          )}
        />

        {uploadError && <div className="resume-tool-error resumes-message" role="alert"><strong>Resume wasn’t uploaded.</strong><span>{uploadError}</span></div>}
        {uploadSuccess && <div className="resumes-success" role="status">{uploadSuccess}</div>}
        {listError && <div className="resume-tool-error resumes-message" role="alert"><strong>We couldn’t load your resumes.</strong><span>{listError}</span><Button variant="secondary" size="sm" onClick={() => loadResumes()}>Try again</Button></div>}

        {pageLoading ? (
          <div className="resumes-loading" role="status">
            <span className="resume-tool-spinner" aria-hidden="true" />
            <span className="resumes-loading__copy"><strong>Finding your saved resumes</strong><small>Getting your PDFs ready to use in an interview plan.</small></span>
          </div>
        ) : resumes.length === 0 && !listError ? (
          <EmptyState
            title="No resumes saved yet"
            description="Upload a PDF to compare your experience with a job description and create a more personal interview plan."
            icon={<span aria-hidden="true">PDF</span>}
            actionLabel="Choose a resume"
            onAction={() => fileInputRef.current?.click()}
          />
        ) : resumes.length > 0 ? (
          <section className="resume-list" aria-label="Saved resumes">
            <div className="resume-list__heading"><strong>{resumes.length} {resumes.length === 1 ? 'resume' : 'resumes'} saved</strong><span>PDF files · up to 5 MB each</span></div>
            {resumes.map((resume) => (
              <Card key={resume._id} className={`saved-resume-card${resume.confirmedInterviewAchievements?.length ? ' saved-resume-card--has-additions' : ''}`}>
                <span className="saved-resume-card__icon" aria-hidden="true">PDF</span>
                <div className="saved-resume-card__copy"><strong>{resume.fileName}</strong><span>Uploaded {new Date(resume.createdAt).toLocaleDateString()}</span></div>
                <Button variant="secondary" onClick={() => selectResume(resume)}>Use for interview plan <span aria-hidden="true">→</span></Button>
                {resume.confirmedInterviewAchievements?.length > 0 && (
                  <div className="saved-resume-additions">
                    <div className="saved-resume-additions__heading"><strong>{resume.confirmedInterviewAchievements.length} interview-confirmed resume {resume.confirmedInterviewAchievements.length === 1 ? 'addition' : 'additions'}</strong><Button variant="ghost" size="sm" onClick={() => copyResumeAdditions(resume)}>{copiedResumeId === resume._id ? 'Copied' : 'Copy bullets'}</Button></div>
                    <ul>{resume.confirmedInterviewAchievements.map((item, index) => <li key={`${item._id || item.confirmedAt}-${index}`}>{item.text}</li>)}</ul>
                    <p>These draft additions are included in future ATS checks and Mira interviews. Add them to your source resume and upload the updated PDF to change that file.</p>
                  </div>
                )}
              </Card>
            ))}
          </section>
        ) : null}

        <div className="resumes-footer-tip"><span aria-hidden="true">i</span><p>Your resume is used to personalize analysis and interview questions. A job description makes the results more specific.</p><Link to="/">Create a plan <span aria-hidden="true">→</span></Link></div>
      </main>
    </div>
  )
}

export default MyResumes
