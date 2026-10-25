import { useEffect, useId, useRef, useState } from 'react'
import { getActiveResumeId, setActiveResumeId } from '../services/activeResume'
import { uploadResume } from '../services/resume.api'
import './ResumePicker.scss'

const ResumePicker = ({
  label,
  value,
  resumes,
  onChange,
  onResumeUploaded,
  onUploadingChange,
  disabled = false,
  placeholder = 'Choose a CV',
  helperText,
}) => {
  const pickerId = useId()
  const pickerRef = useRef(null)
  const inputRef = useRef(null)
  const triggerRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [uploadMessage, setUploadMessage] = useState('')
  const selectedResume = resumes.find((resume) => resume._id === value)
  const activeResumeId = getActiveResumeId()

  useEffect(() => {
    if (!open) return undefined
    const handleOutsideClick = (event) => {
      if (!pickerRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', handleOutsideClick)
    return () => document.removeEventListener('pointerdown', handleOutsideClick)
  }, [open])

  const chooseResume = (resumeId) => {
    setActiveResumeId(resumeId)
    onChange(resumeId)
    setUploadError('')
    setUploadMessage('')
    setOpen(false)
    triggerRef.current?.focus()
  }

  const handleFileSelect = async (event) => {
    const input = event.currentTarget
    const file = input.files?.[0]
    if (!file) return

    setUploadError('')
    setUploadMessage('')
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
    onUploadingChange?.(true)
    try {
      const response = await uploadResume(file)
      const resume = response.resume
      if (!resume?._id) throw new Error('The CV could not be saved. Please try uploading it again.')

      setActiveResumeId(resume._id)
      onResumeUploaded(resume)
      onChange(resume._id)
      setUploadMessage(`${resume.fileName || file.name} uploaded and set as your active CV.`)
    } catch (error) {
      setUploadError(error.response?.data?.message || error.message || 'Could not upload your CV. Please try again.')
    } finally {
      setUploading(false)
      onUploadingChange?.(false)
      input.value = ''
      triggerRef.current?.focus()
    }
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Escape' && open) {
      setOpen(false)
      triggerRef.current?.focus()
      return
    }

    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const key = event.key

    if (!open) {
      setOpen(true)
      window.requestAnimationFrame(() => {
        const items = [...(pickerRef.current?.querySelectorAll('.resume-picker__option, .resume-picker__upload') || [])]
        const target = key === 'ArrowUp' || key === 'End' ? items[items.length - 1] : items[0]
        target?.focus()
      })
      return
    }

    const items = [...(pickerRef.current?.querySelectorAll('.resume-picker__option, .resume-picker__upload') || [])]
    if (!items.length) return
    const currentIndex = items.indexOf(document.activeElement)
    if (event.key === 'Home') return items[0].focus()
    if (event.key === 'End') return items[items.length - 1].focus()
    const direction = event.key === 'ArrowDown' ? 1 : -1
    const startIndex = currentIndex < 0 ? (direction > 0 ? -1 : 0) : currentIndex
    items[(startIndex + direction + items.length) % items.length].focus()
  }

  return (
    <div
      className={`resume-picker${open ? ' resume-picker--open' : ''}`}
      ref={pickerRef}
      onKeyDown={handleKeyDown}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false)
      }}
    >
      {label && <label className="resume-picker__label" htmlFor={`${pickerId}-trigger`}>{label}</label>}
      <button
        ref={triggerRef}
        id={`${pickerId}-trigger`}
        type="button"
        className={`resume-picker__trigger${open ? ' resume-picker__trigger--open' : ''}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={`${pickerId}-menu`}
        disabled={disabled || uploading}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="resume-picker__current-copy">
          <strong>{selectedResume?.fileName || placeholder}</strong>
          <small>
            {uploading ? 'Uploading and saving your CV…' : selectedResume
              ? selectedResume._id === activeResumeId ? 'Active resume' : 'Select this resume'
              : 'Choose a resume'}
          </small>
        </span>
        <span className={`resume-picker__chevron${open ? ' resume-picker__chevron--open' : ''}`} aria-hidden="true">⌄</span>
      </button>

      {open && (
        <div id={`${pickerId}-menu`} className="resume-picker__menu" role="menu" aria-label={`${label || 'CV'} options`}>
          {resumes.length > 0 ? (
            <div className="resume-picker__options">
              {resumes.map((resume) => {
                const isSelected = resume._id === value
                const isActive = resume._id === activeResumeId
                const uploadDate = resume.createdAt ? new Date(resume.createdAt).toLocaleDateString() : ''
                return (
                  <button
                    key={resume._id}
                    type="button"
                    role="menuitemradio"
                    aria-checked={isSelected}
                    className={`resume-picker__option${isSelected ? ' resume-picker__option--selected' : ''}`}
                    onClick={() => chooseResume(resume._id)}
                  >
                    <span className="resume-picker__option-copy">
                      <strong>{resume.fileName}</strong>
                      <small>{isActive ? `Active${uploadDate ? ` · ${uploadDate}` : ''}` : uploadDate ? `Uploaded ${uploadDate}` : 'Resume'}</small>
                    </span>
                    {isSelected && <span className="resume-picker__check" aria-hidden="true">✓</span>}
                  </button>
                )
              })}
            </div>
          ) : (
            <p className="resume-picker__empty">No CVs yet. Upload a PDF to get started.</p>
          )}
          <div className="resume-picker__menu-divider" />
          <button
            type="button"
            role="menuitem"
            className="resume-picker__upload"
            onClick={() => {
              setOpen(false)
              inputRef.current?.click()
            }}
          >
            <span className="resume-picker__upload-icon" aria-hidden="true">＋</span>
            <span className="resume-picker__upload-copy">Upload a new CV</span>
            <small>PDF · 5 MB max</small>
          </button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        aria-label="Upload a new CV PDF"
        tabIndex={-1}
        className="resume-picker__file-input"
        onChange={handleFileSelect}
      />

      {uploadError ? (
        <small className="resume-picker__message resume-picker__message--error" role="alert">{uploadError}</small>
      ) : uploadMessage ? (
        <small className="resume-picker__message resume-picker__message--success" role="status">{uploadMessage}</small>
      ) : !uploading && helperText ? (
        <small className="resume-picker__helper">{helperText}</small>
      ) : null}
    </div>
  )
}

export default ResumePicker
