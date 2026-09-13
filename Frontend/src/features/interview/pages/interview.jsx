import React, { useState } from 'react'
import '../style/interview.scss'
import { useInterview } from '../hooks/useInterview.js'
import { useParams, Link } from 'react-router'
import AppNavbar from '../../../components/AppNavbar'
import { Button } from '../../../components/ui'
import { shareReport, getStarCheck } from '../services/interview.api'
import CodeRunner from '../components/CodeRunner'
import GrammarCheck from '../components/GrammarCheck'


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
]

// ── Sub-components ────────────────────────────────────────────────────────────
const QuestionCard = ({ item, index }) => {
    const [ open, setOpen ] = useState(false)
    const [copied, setCopied] = useState(false)
    const [practiceAnswer, setPracticeAnswer] = useState('')
    const [starFeedback, setStarFeedback] = useState(null)
    const [starLoading, setStarLoading] = useState(false)
    const [starError, setStarError] = useState('')

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
            <div className='q-card__header' onClick={() => setOpen(o => !o)}>
                <span className='q-card__index'>Q{index + 1}</span>
                <p className='q-card__question'>{item.question}</p>
                <span className={`q-card__badge ${difficultyClass}`}>{item.difficulty || 'Medium'}</span>
                <button type='button' className='copy-btn' onClick={(e) => { e.stopPropagation(); onCopy(item.question) }} title='Copy question'>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                </button>
                <span className={`q-card__chevron ${open ? 'q-card__chevron--open' : ''}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                </span>
            </div>
            {open && (
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
                            <CodeRunner questionId={item._id} />
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

// ── Main Component ────────────────────────────────────────────────────────────
const Interview = () => {
    const [ activeNav, setActiveNav ] = useState('technical')
    const { report, loading, getResumePdf, lastWarnings } = useInterview()
    const { interviewId } = useParams()
    const [ pdfLoading, setPdfLoading ] = useState(false)
    const [shareLoading, setShareLoading] = useState(false)
    const [shareToken, setShareToken] = useState(null)

    const handleDownloadPdf = async (type) => {
        try {
            setPdfLoading(true)
            await getResumePdf(interviewId, type)
        } catch {
            alert("Failed to generate PDF. Please try again.")
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
        return (
            <main className='loading-screen'>
                <h1>Loading your interview plan...</h1>
            </main>
        )
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

                        <p className='interview-nav__downloads-label' style={{ marginTop: '1rem' }}>Export PDF</p>
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