import React, { useEffect, useState } from 'react'
import AppNavbar from '../../../components/AppNavbar'
import { listResumes, uploadResume } from '../services/resume.api'
import { generateInterviewReport } from '../../interview/services/interview.api'
import { Card, PageHeader, Button, EmptyState } from '../../../components/ui'

const MyResumes = () => {
  const [resumes, setResumes] = useState([])
  const [file, setFile] = useState(null)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    try {
      const res = await listResumes()
      setResumes(res.resumes || [])
    } catch (e) {
      console.error(e)
    }
  }

  async function onUpload(e) {
    const f = e.target.files[0]
    if (!f) return
    setFile(f)
    try {
      await uploadResume(f)
      setFile(null)
      load()
    } catch (err) {
      alert('Upload failed')
    }
  }

  async function generateFrom(resumeId) {
    try {
      const payload = { jobDescription: 'Use this resume to generate interview', resumeId }
      await generateInterviewReport(payload)
      alert('Interview generation started')
    } catch (e) {
      const message = e?.response?.data?.message || e?.message || 'Failed to generate interview'
      alert(message)
    }
  }

  return (
    <div className="page-shell">
      <AppNavbar />
      <main className="container">
        <PageHeader
          title="My Resumes"
          subtitle="Upload your latest resume files and generate interview plans tailored to your experience."
          action={
            <label style={{ display: 'inline-flex', cursor: 'pointer' }}>
              <input type="file" accept="application/pdf" onChange={onUpload} style={{ display: 'none' }} />
              <Button variant="primary" size="md">Upload PDF</Button>
            </label>
          }
        />

        {file && <div style={{ marginBottom: 'var(--space-4)', color: 'var(--color-text-secondary)' }}>Selected: {file.name}</div>}

        {resumes.length === 0 ? (
          <EmptyState
            title="No resumes yet"
            description="Upload a PDF to start generating interview plans for your target roles."
            icon={<span>PDF</span>}
            actionLabel="Choose resume"
            onAction={() => document.querySelector('input[type="file"]').click()}
          />
        ) : (
          <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
            {resumes.map(r => (
              <Card key={r._id} interactive style={{ padding: 'var(--space-4)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{r.fileName}</div>
                    <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem', marginTop: 'var(--space-1)' }}>
                      {new Date(r.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <Button variant="primary" onClick={() => generateFrom(r._id)}>Create interview plan</Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default MyResumes
