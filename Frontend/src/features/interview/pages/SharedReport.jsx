import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router'
import { getSharedReport, addMentorComment } from '../services/interview.api'
import '../style/shared.scss'

const SharedReport = () => {
  const { shareToken } = useParams()
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [commentText, setCommentText] = useState('')
  const [commentAuthor, setCommentAuthor] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const res = await getSharedReport(shareToken)
        setReport(res.report)
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load shared report')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [shareToken])

  const handleComment = async (e) => {
    e.preventDefault()
    if (!commentText.trim()) return

    setSubmitting(true)
    try {
      const res = await addMentorComment(shareToken, {
        author: commentAuthor.trim() || 'Anonymous Mentor',
        text: commentText.trim(),
      })
      setReport(prev => ({
        ...prev,
        mentorComments: [...(prev.mentorComments || []), res.comment],
      }))
      setCommentText('')
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add comment')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <main className='loading-screen'>
        <h1>Loading shared report...</h1>
      </main>
    )
  }

  if (error) {
    return (
      <main className='loading-screen'>
        <h1>{error}</h1>
      </main>
    )
  }

  const scoreColor =
    report.matchScore >= 80 ? 'score--high' :
    report.matchScore >= 60 ? 'score--mid' : 'score--low'

  return (
    <div className='shared-page-wrap'>
      <header className='shared-header'>
        <h1 className='shared-brand'>SkillMirror</h1>
        <p className='shared-subtitle'>Shared Interview Report (Read-only)</p>
      </header>

      <div className='shared-layout'>
        {/* Main Content */}
        <main className='shared-main'>
          <div className='shared-title-bar'>
            <h2>{report.title || 'Interview Report'}</h2>
            <span className='shared-date'>Generated {new Date(report.createdAt).toLocaleDateString()}</span>
          </div>

          {/* Technical Questions */}
          {report.technicalQuestions?.length > 0 && (
            <section className='shared-section'>
              <h3>Technical Questions</h3>
              {report.technicalQuestions.map((q, i) => (
                <div key={i} className='shared-question'>
                  <div className='shared-question__head'>
                    <span className={`shared-diff shared-diff--${(q.difficulty || 'medium').toLowerCase()}`}>{q.difficulty}</span>
                    <span className='shared-q-num'>Q{i + 1}</span>
                  </div>
                  <p className='shared-q-text'>{q.question}</p>
                  <div className='shared-q-body'>
                    <span className='shared-tag shared-tag--intention'>Why asked</span>
                    <p>{q.intention}</p>
                  </div>
                  <div className='shared-q-body'>
                    <span className='shared-tag shared-tag--answer'>Model Answer</span>
                    <p>{q.answer}</p>
                  </div>
                </div>
              ))}
            </section>
          )}

          {/* Behavioral Questions */}
          {report.behaviouralQuestions?.length > 0 && (
            <section className='shared-section'>
              <h3>Behavioral Questions</h3>
              {report.behaviouralQuestions.map((q, i) => (
                <div key={i} className='shared-question'>
                  <div className='shared-question__head'>
                    <span className={`shared-diff shared-diff--${(q.difficulty || 'medium').toLowerCase()}`}>{q.difficulty}</span>
                    <span className='shared-q-num'>Q{i + 1}</span>
                  </div>
                  <p className='shared-q-text'>{q.question}</p>
                  <div className='shared-q-body'>
                    <span className='shared-tag shared-tag--intention'>Why asked</span>
                    <p>{q.intention}</p>
                  </div>
                  <div className='shared-q-body'>
                    <span className='shared-tag shared-tag--answer'>Model Answer</span>
                    <p>{q.answer}</p>
                  </div>
                </div>
              ))}
            </section>
          )}

          {/* Preparation Plan */}
          {report.preparationPlan?.length > 0 && (
            <section className='shared-section'>
              <h3>Preparation Roadmap</h3>
              <div className='shared-roadmap'>
                {report.preparationPlan.map((day) => (
                  <div key={day.day} className='shared-roadmap__day'>
                    <span className='shared-roadmap__badge'>Day {day.day}</span>
                    <strong>{day.focus}</strong>
                    <ul>
                      {(day.tasks || []).map((t, i) => <li key={i}>{t}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>

        {/* Sidebar */}
        <aside className='shared-sidebar'>
          <div className='shared-score-card'>
            <p className='shared-score-label'>Match Score</p>
            <div className={`shared-score-ring ${scoreColor}`}>
              <span>{report.matchScore}</span>
              <small>%</small>
            </div>
          </div>

          {report.skillGaps?.length > 0 && (
            <div className='shared-skill-gaps'>
              <p className='shared-score-label'>Skill Gaps</p>
              {report.skillGaps.map((gap, i) => (
                <span key={i} className={`skill-tag skill-tag--${gap.severity}`}>{gap.skill}</span>
              ))}
            </div>
          )}
        </aside>
      </div>

      {/* Mentor Comments Section */}
      <section className='shared-comments'>
        <h3>Mentor Comments</h3>

        {report.mentorComments?.length > 0 ? (
          <div className='shared-comments__list'>
            {report.mentorComments.map((c, i) => (
              <div key={c._id || i} className='shared-comment'>
                <strong>{c.author}</strong>
                <p>{c.text}</p>
                <small>{new Date(c.createdAt).toLocaleString()}</small>
              </div>
            ))}
          </div>
        ) : (
          <p className='shared-comments__empty'>No comments yet. Be the first mentor to leave feedback.</p>
        )}

        <form onSubmit={handleComment} className='shared-comment-form'>
          <input
            type='text'
            value={commentAuthor}
            onChange={(e) => setCommentAuthor(e.target.value)}
            placeholder='Your name (optional)'
            className='shared-comment-input'
          />
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            rows={3}
            placeholder='Write your feedback or advice...'
            className='shared-comment-textarea'
            required
          />
          <button type='submit' disabled={submitting || !commentText.trim()} className='button primary-button'>
            {submitting ? 'Posting...' : 'Post Comment'}
          </button>
        </form>
      </section>
    </div>
  )
}

export default SharedReport
