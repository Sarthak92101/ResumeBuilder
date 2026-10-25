import React, { lazy, Suspense, useEffect, useId, useState } from 'react'
import '../style/interview.scss'
import { useInterview } from '../hooks/useInterview.js'
import { useParams, Link, useLocation } from 'react-router'
import AppNavbar from '../../../components/AppNavbar'
import { Button } from '../../../components/ui'
import { shareReport, getStarCheck, checkProofClaim as checkProofClaimApi } from '../services/interview.api'
import GrammarCheck from '../components/GrammarCheck'
import LoadingExperience from '../../../components/ui/LoadingExperience.jsx'

const CodeRunner = lazy(() => import('../components/CodeRunner'))


const STAR_LABELS = [
  { key: 'situation', label: 'Situation' },
  { key: 'task', label: 'Task' },
  { key: 'action', label: 'Action' },
  { key: 'result', label: 'Result' },
]

const NAV_ITEMS = [
    { id: 'technical', label: 'Technical Questions', icon: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>) },
    { id: 'behavioral', label: 'Behavioral Questions', icon: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>) },
    { id: 'roadmap', label: 'Road Map', icon: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11" /></svg>) },
    { id: 'proof', label: 'Resume Proof Check', icon: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>) },
]

// ── Sub-components ────────────────────────────────────────────────────────────
const QuestionCard = ({ item, index }) => {
    const [ open, setOpen ] = useState(false)
    const [bodyMounted, setBodyMounted] = useState(false)
    const [copied, setCopied] = useState(false)
    const [practiceAnswer, setPracticeAnswer] = useState('')
    const [starFeedback, setStarFeedback] = useState(null)
    const [starLoading, setStarLoading] = useState(false)
    const [starError, setStarError] = useState('')
    const answerId = useId()

    useEffect(() => {
        if (open || !bodyMounted) return undefined
        const timer = window.setTimeout(() => setBodyMounted(false), 280)
        return () => window.clearTimeout(timer)
    }, [open, bodyMounted])

    const toggleOpen = () => {
        if (open) {
            setOpen(false)
            return
        }
        setBodyMounted(true)
        window.requestAnimationFrame(() => setOpen(true))
    }

    const difficultyClass = item.difficulty === 'Easy' ? 'badge--low' : item.difficulty === 'Hard' ? 'badge--high' : 'badge--mid'

    const onCopy = async (text) => {
        try {
            await navigator.clipboard.writeText(text)
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
        } catch {
            // ignore
        }
    }

    const onCheckStar = async () => {
        if (!practiceAnswer.trim()) {
            setStarError('Write an answer first to check it against the STAR framework.')
            return
        }
        setStarLoading(true)
        setStarError('')
        setStarFeedback(null)
        try {
            const response = await getStarCheck({ questionText: item.question, userAnswer: practiceAnswer })
            setStarFeedback(response.feedback)
        } catch (err) {
            setStarError(err.response?.data?.message || err.message || 'Failed to check STAR framework')
        } finally {
            setStarLoading(false)
        }
    }

    const isCodingQuestion = Boolean(item.isCoding) && Array.isArray(item.testCases) && item.testCases.length > 0

    return (
        <div className='q-card'>
            <div
                className='q-card__header'
            >
                <button type='button' className='q-card__toggle' onClick={toggleOpen} aria-expanded={open} aria-controls={answerId}>
                    <span className='q-card__index'>Q{index + 1}</span>
                    <span className='q-card__question'>{item.question}</span>
                    <span className={`q-card__badge ${difficultyClass}`}>{item.difficulty || 'Medium'}</span>
                    <span className={`q-card__chevron ${open ? 'q-card__chevron--open' : ''}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                    </span>
                </button>
                <button type='button' className='copy-btn' onClick={() => onCopy(item.question)} title='Copy question' aria-label='Copy question'>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4h9a2 2 0 0 1 2 2v1"/></svg>
                </button>
            </div>
            {bodyMounted && (
                <div id={answerId} className={`q-card__body-wrap ${open ? 'q-card__body-wrap--open' : ''}`} aria-hidden={!open} inert={!open}>
                    <div className='q-card__body-inner'>
                        <div className='q-card__body'>
                            <div className='q-card__section'>
                                <span className='q-card__tag q-card__tag--intention'>Intention</span>
                                <p>{item.intention}</p>
                            </div>
                            <div className='q-card__section'>
                                <span className='q-card__tag q-card__tag--answer'>Model Answer</span>
                                <p>{item.answer}</p>
                            </div>

                            {isCodingQuestion && (
                                <div className='q-card__section'>
                                    <Suspense fallback={<div className='code-runner-loading' role='status'><span className='code-runner-loading__spinner' aria-hidden='true' />Preparing your coding workspace…</div>}>
                                        <CodeRunner questionId={item._id} />
                                    </Suspense>
                                </div>
                            )}

                            <div className='q-card__section'>
                                <span className='q-card__tag q-card__tag--practice'>Practice Answer</span>
                                <textarea
                                    className='star-textarea'
                                    value={practiceAnswer}
                                    onChange={(e) => setPracticeAnswer(e.target.value)}
                                    rows={4}
                                    placeholder='Write your own answer here, then check the STAR framework and grammar...'
                                />
                                <div className='star-actions'>
                                    <Button size='sm' variant='secondary' onClick={onCheckStar} disabled={starLoading}>
                                        {starLoading ? 'Checking...' : 'Check STAR'}
                                    </Button>
                                    <span className='star-hint'>Situation, Task, Action, Result</span>
                                </div>
                                <GrammarCheck text={practiceAnswer} />

                                {starError && <div className='star-error'>{starError}</div>}

                                {starFeedback && (
                                    <div className='star-result'>
                                        <div className='star-result__row'>
                                            {STAR_LABELS.map(({ key, label }) => (
                                                <span key={key} className={`star-label ${starFeedback[key] ? 'star-label--ok' : 'star-label--no'}`}>
                                                    {label}: {starFeedback[key] ? 'Yes' : 'No'}
                                                </span>
                                            ))}
                                        </div>
                                        {starFeedback.improvementAdvice && (
                                            <p className='star-result__advice'>
                                                <strong>Improvement:</strong> {starFeedback.improvementAdvice}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {copied && <div className='copy-toast'>Copied!</div>}
        </div>
    )
}

const RoadMapDay = ({ day }) => (
    <div className='roadmap-day'>
        <div className='roadmap-day__header'>
            <span className='roadmap-day__badge'>Day {day.day}</span>
            <h3 className='roadmap-day__focus'>{day.focus}</h3>
        </div>
        <ul className='roadmap-day__tasks'>
            {day.tasks.map((task, i) => (
                <li key={i}>
                    <span className='roadmap-day__bullet' />
                    {task}
                </li>
            ))}
        </ul>
    </div>
)

const ProofClaimCard = ({ interviewId, claim, onUpdate }) => {
    const latestAttempt = claim.attempts?.[claim.attempts.length - 1]
    const claimText = claim.claim?.replace(/\s+/g, ' ').trim().toLowerCase()
    const sourceText = claim.sourceText?.replace(/\s+/g, ' ').trim().toLowerCase()
    const showSource = claim.sourceText && sourceText !== claimText
    const [answer, setAnswer] = useState(latestAttempt?.answer || '')
    const [evidenceNote, setEvidenceNote] = useState(latestAttempt?.evidenceNote || '')
    const [evidenceUrl, setEvidenceUrl] = useState(latestAttempt?.evidenceUrl || '')
    const [feedback, setFeedback] = useState(latestAttempt || null)
    const [checking, setChecking] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        const latest = claim.attempts?.[claim.attempts.length - 1] || null
        setAnswer(latest?.answer || '')
        setEvidenceNote(latest?.evidenceNote || '')
        setEvidenceUrl(latest?.evidenceUrl || '')
        setFeedback(latest)
    }, [claim])

    const handleCheck = async () => {
        if (!answer.trim()) {
            setError('Pehle apna jawab likho, phir SkillMirror us par feedback dega.')
            return
        }

        setChecking(true)
        setError('')
        try {
            const response = await checkProofClaimApi(interviewId, claim._id, {
                answer,
                evidenceNote,
                evidenceUrl,
            })
            onUpdate(response.proofClaim)
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Proof check abhi complete nahi hua. Dobara try karo.')
        } finally {
            setChecking(false)
        }
    }

    return (
        <article className='proof-claim-card' aria-busy={checking}>
            <div className='proof-claim-card__heading'>
                <span className='proof-claim-card__skill'>{claim.skill}</span>
                {feedback && <span className={`proof-claim-status proof-claim-status--${feedback.status}`}>
                    {feedback.status === 'clear_explanation' ? 'Clear explanation' : 'Needs more detail'}
                </span>}
            </div>
            <h3>{claim.claim}</h3>
            {showSource && <blockquote className='proof-claim-card__source'>Resume line: “{claim.sourceText}”</blockquote>}
            <p className='proof-claim-card__question'>{claim.challengeQuestion}</p>

            <label className='proof-claim-field'>
                <span>Your answer</span>
                <textarea value={answer} onChange={(event) => setAnswer(event.target.value)} rows={4} maxLength={4000} placeholder='What did you do, how did you measure it, and what changed?' />
            </label>
            <label className='proof-claim-field'>
                <span>Evidence note <small>(optional)</small></span>
                <textarea value={evidenceNote} onChange={(event) => setEvidenceNote(event.target.value)} rows={2} maxLength={1500} placeholder='Add context, a metric, or where to find the proof.' />
            </label>
            <label className='proof-claim-field'>
                <span>Project or evidence link <small>(optional)</small></span>
                <input type='url' value={evidenceUrl} onChange={(event) => setEvidenceUrl(event.target.value)} maxLength={500} placeholder='https://…' />
            </label>

            {error && <p className='proof-claim-error' role='alert'>{error}</p>}
            <Button variant='primary' size='sm' onClick={handleCheck} disabled={checking}>
                {checking ? 'Checking answer…' : 'Check my answer'}
            </Button>

            {feedback && <div key={`${claim._id}-${feedback.answer}-${feedback.summary}`} className='proof-claim-feedback' aria-live='polite'>
                <p>{feedback.summary}</p>
                {feedback.strengths?.length > 0 && <div><strong>Strong points</strong><ul>{feedback.strengths.map((item, index) => <li key={index}>{item}</li>)}</ul></div>}
                {feedback.missingDetails?.length > 0 && <div><strong>Add more detail</strong><ul>{feedback.missingDetails.map((item, index) => <li key={index}>{item}</li>)}</ul></div>}
                {feedback.nextQuestion && <p><strong>Next practice question:</strong> {feedback.nextQuestion}</p>}
                <small>Ye jawab ki clarity par feedback hai; link ya achievement ko independently verify nahi kiya gaya.</small>
            </div>}
        </article>
    )
}

// ── Main Component ────────────────────────────────────────────────────────────
const Interview = () => {
    const [ activeNav, setActiveNav ] = useState('technical')
    const { report, loading, getResumePdf, lastWarnings } = useInterview()
    const { interviewId } = useParams()
    const location = useLocation()
    const [ pdfLoading, setPdfLoading ] = useState(false)
    const [shareLoading, setShareLoading] = useState(false)
    const [shareToken, setShareToken] = useState(null)
    const [proofClaims, setProofClaims] = useState(report?.proofClaims || [])

    useEffect(() => {
        setProofClaims(report?.proofClaims || [])
    }, [report])

    const handleDownloadPdf = async (type) => {
        try {
            setPdfLoading(true)
            await getResumePdf(interviewId, type)
        } catch (error) {
            alert(error.response?.data?.message || error.message || "Failed to generate PDF. Please try again.")
        } finally {
            setPdfLoading(false)
        }
    }

    const handleShare = async () => {
        try {
            setShareLoading(true)
            const res = await shareReport(interviewId)
            setShareToken(res.shareToken)
        } catch {
            alert("Failed to generate share link.")
        } finally {
            setShareLoading(false)
        }
    }

    const shareUrl = shareToken ? `${window.location.origin}/shared/${shareToken}` : ''



    if (loading || !report) {
        return <LoadingExperience title='Building your interview room' detail='Loading your role-specific questions, practice plan, and next steps.' />
    }

    const scoreColor =
        report.matchScore >= 80 ? 'score--high' :
            report.matchScore >= 60 ? 'score--mid' : 'score--low'


    return (
        <div className='interview-page-wrap'>
            <AppNavbar />
        <div className='interview-page'>
            {lastWarnings?.length > 0 && (
                <div className='report-warnings'>
                    {lastWarnings.map((warning, i) => <p key={i}>{warning}</p>)}
                </div>
            )}
            <div className='interview-layout'>

                {/* ── Left Nav ── */}
                <nav className='interview-nav'>
                    <div className="nav-content">
                        <p className='interview-nav__label'>Sections</p>
                        {NAV_ITEMS.map(item => (
                            <button
                                key={item.id}
                                className={`interview-nav__item ${activeNav === item.id ? 'interview-nav__item--active' : ''}`}
                                onClick={() => setActiveNav(item.id)}
                            >
                                <span className='interview-nav__icon'>{item.icon}</span>
                                {item.label}
                            </button>
                        ))}
                    </div>
                    <div className='interview-nav__downloads'>
                        <p className='interview-nav__downloads-label'>AI interview</p>
                        <Link to='/ai-coach' state={location.state} className='voice-mock-btn'>
                            <Button variant='secondary' size='md' style={{ width: '100%' }}>
                                Practice with Mira <span aria-hidden='true'>→</span>
                            </Button>
                        </Link>
                        <p className='interview-nav__downloads-label'>Practice</p>
                        <Link to={`/voice/${interviewId}`} className='voice-mock-btn'>
                            <Button variant='primary' size='md' style={{ width: '100%' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className='voice-mock-btn__icon'>
                                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                                <line x1="12" y1="19" x2="12" y2="23"/>
                                <line x1="8" y1="23" x2="16" y2="23"/>
                            </svg>
                            Voice Mock Interview
                            </Button>
                        </Link>

                        <p className='interview-nav__downloads-label'>Export PDF</p>
                        <div className='interview-nav__download-row'>
                            <Button
                                type='button'
                                onClick={() => handleDownloadPdf("resume")}
                                disabled={pdfLoading || !report?.resume}
                                variant='primary'
                                size='sm'>
                                {pdfLoading ? "Generating…" : "Resume PDF"}
                            </Button>
                            <Button
                                type='button'
                                onClick={() => handleDownloadPdf("plan")}
                                disabled={pdfLoading}
                                variant='secondary'
                                size='sm'>
                                {pdfLoading ? "Generating…" : "Full Plan PDF"}
                            </Button>
                        </div>

                        <p className='interview-nav__downloads-label interview-nav__downloads-label--mt'>Share Report</p>
                        {shareToken ? (
                            <div className='share-link-box'>
                                <input type='text' readOnly value={shareUrl} className='share-link-input' onClick={(e) => e.target.select()} />
                                <Button type='button' variant='secondary' size='sm' onClick={() => navigator.clipboard.writeText(shareUrl)}>
                                    Copy
                                </Button>
                            </div>
                        ) : (
                            <Button
                                type='button'
                                onClick={handleShare}
                                disabled={shareLoading}
                                variant='primary'
                                size='sm'>
                                {shareLoading ? "Generating…" : "Generate Share Link"}
                            </Button>
                        )}
                    </div>
                </nav>

                <div className='interview-divider' />

                {/* ── Center Content ── */}
                <main className='interview-content'>
                    {activeNav === 'technical' && (
                        <section>
                            <div className='content-header'>
                                <h2>Technical Questions</h2>
                                <span className='content-header__count'>{report.technicalQuestions?.length ?? 0} questions</span>
                            </div>
                            <div className='q-list'>
                                {(report.technicalQuestions || []).map((q, i) => (
                                    <QuestionCard key={i} item={q} index={i} />
                                ))}
                            </div>
                        </section>
                    )}

                    {activeNav === 'behavioral' && (
                        <section>
                            <div className='content-header'>
                                <h2>Behavioral Questions</h2>
                                <span className='content-header__count'>{report.behaviouralQuestions?.length ?? 0} questions</span>
                            </div>
                            <div className='q-list'>
                                {(report.behaviouralQuestions || []).map((q, i) => (
                                    <QuestionCard key={i} item={q} index={i} />
                                ))}
                            </div>
                        </section>
                    )}

                    {activeNav === 'roadmap' && (
                        <section>
                            <div className='content-header'>
                                <h2>Preparation Road Map</h2>
                                <span className='content-header__count'>{report.preparationPlan?.length ?? 0}-day plan</span>
                            </div>
                            <div className='roadmap-list'>
                                {(report.preparationPlan || []).map((day) => (
                                    <RoadMapDay key={day.day} day={day} />
                                ))}
                            </div>
                        </section>
                    )}

                    {activeNav === 'proof' && (
                        <section>
                            <div className='content-header'>
                                <h2>Resume Proof Check</h2>
                                <span className='content-header__count'>{proofClaims.length} claims</span>
                            </div>
                            <p className='proof-check-intro'>Resume ke real claims par interviewer-style sawaal practice karo. SkillMirror tumhare jawab ki clarity check karega; ye tumhare achievement ki sachchai verify nahi karta.</p>
                            {proofClaims.length ? (
                                <div className='proof-claim-list'>
                                    {proofClaims.map((claim) => <ProofClaimCard
                                        key={claim._id}
                                        interviewId={interviewId}
                                        claim={claim}
                                        onUpdate={(updatedClaim) => setProofClaims((current) => current.map((item) => item._id === updatedClaim._id ? updatedClaim : item))}
                                    />)}
                                </div>
                            ) : (
                                <div className='proof-check-empty'>Is report mein resume claims nahi mile. Resume ke saath naya interview plan banao, phir yahan claims par practice kar paoge.</div>
                            )}
                        </section>
                    )}
                </main>

                <div className='interview-divider' />

                {/* ── Right Sidebar ── */}
                <aside className='interview-sidebar'>

                    {/* Match Score */}
                    <div className='match-score'>
                        <p className='match-score__label'>Match Score</p>
                        <div className={`match-score__ring ${scoreColor}`}>
                            <span className='match-score__value'>{report.matchScore}</span>
                            <span className='match-score__pct'>%</span>
                        </div>
                        <p className='match-score__sub'>Strong match for this role</p>
                    </div>

                    <div className='sidebar-divider' />

                    {/* Skill Gaps */}
                    <div className='skill-gaps'>
                        <p className='skill-gaps__label'>Skill Gaps</p>
                        <div className='skill-gaps__list'>
                            {(report.skillGaps || []).map((gap, i) => (
                                <span key={i} className={`skill-tag skill-tag--${gap.severity}`}>
                                    {gap.skill}
                                </span>
                            ))}
                        </div>
                    </div>

                </aside>
            </div>
        </div>
        </div>
    )
}

export default Interview
