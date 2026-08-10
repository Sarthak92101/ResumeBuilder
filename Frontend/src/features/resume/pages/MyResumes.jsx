import React, { useEffect, useState } from 'react'
import AppNavbar from '../../../components/AppNavbar'
import { listResumes, uploadResume } from '../services/resume.api'
import { generateInterviewReport } from '../../interview/services/interview.api'
import './MyResumes.scss'

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
      // call existing generate endpoint with resumeId
      const payload = { jobDescription: 'Use this resume to generate interview', resumeId }
      await generateInterviewReport(payload)
      alert('Interview generation started')
    } catch (e) {
      const message = e?.response?.data?.message || e?.message || 'Failed to generate interview'
      alert(message)
    }
  }

  return (
    <div>
      <AppNavbar />
      <main className="container">
        <section className="page-header">
          <div>
            <p className="eyebrow">Resume Library</p>
            <h1>My Resumes</h1>
            <p className="subtitle">Upload your latest resume files and generate interview plans tailored to your experience.</p>
          </div>
        </section>

        <div className="upload-row">
          <label className="file-picker">
            <input type="file" accept="application/pdf" onChange={onUpload} />
            <span className="file-picker__button">Choose resume PDF</span>
            <span className="file-picker__hint">PDF only, max 5MB</span>
          </label>
          {file && <div className="file-picker__selected">Selected: {file.name}</div>}
        </div>

        <div className="resumes-list">
          {resumes.map(r => (
            <div key={r._id} className="card">
              <div className="card-row">
                <div>
                  <strong>{r.fileName}</strong>
                  <div className="muted">{new Date(r.createdAt).toLocaleString()}</div>
                </div>
                <div>
                  <button className="button primary-button" onClick={() => generateFrom(r._id)}>Create interview plan</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

export default MyResumes
