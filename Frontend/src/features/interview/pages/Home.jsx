import React, { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import AppNavbar from '../../../components/AppNavbar'
import { Badge, Button, Card, Input, Modal, Textarea } from '../../../components/ui'
import GrammarCheck from '../components/GrammarCheck'
import { useInterview } from '../hooks/useInterview.js'
import '../style/home.scss'
import '../style/preview.scss'

const LEETCODE_COLORS = { Easy: '#22c55e', Medium: '#f59e0b', Hard: '#ef4444' }
const GENERATION_STAGES = [
    {
        title: 'Matching your role',
        description: 'Using the job description and experience you shared.',
    },
    {
        title: 'Creating tailored questions',
        description: 'Shaping technical and behavioral practice for this role.',
    },
    {
        title: 'Finishing your prep roadmap',
        description: 'Organizing questions and next steps for focused practice.',
    },
]

const Home = () => {
    const { loading, generateReport, reports, fetchGitHubProfile, fetchLeetCodeProfile, fetchCodeforcesProfile } = useInterview()
    const location = useLocation()
    const [jobDescription, setJobDescription] = useState('')
    const [selfDescription, setSelfDescription] = useState('')
    const [targetCompany, setTargetCompany] = useState('')
    const [interviewDate, setInterviewDate] = useState('')
    const [language, setLanguage] = useState('en')
    const [error, setError] = useState('')
    const [selectedFileName, setSelectedFileName] = useState('')
    const [selectedResumeId, setSelectedResumeId] = useState(location.state?.resumeId || '')
    const [selectedSavedResumeName, setSelectedSavedResumeName] = useState(location.state?.fileName || '')
    const [githubUsername, setGithubUsername] = useState('')
    const [leetcodeUsername, setLeetcodeUsername] = useState('')
    const [codeforcesHandle, setCodeforcesHandle] = useState('')
    const [githubPreview, setGithubPreview] = useState(null)
    const [leetcodePreview, setLeetcodePreview] = useState(null)
    const [codeforcesPreview, setCodeforcesPreview] = useState(null)
    const [githubWarning, setGithubWarning] = useState('')
    const [leetcodeWarning, setLeetcodeWarning] = useState('')
    const [codeforcesWarning, setCodeforcesWarning] = useState('')
    const [generationStage, setGenerationStage] = useState(0)
    const resumeInputRef = useRef(null)
    const navigate = useNavigate()

    useEffect(() => {
        if (!loading) {
            setGenerationStage(0)
            return undefined
        }
        if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined

        const timer = window.setInterval(() => {
            setGenerationStage((current) => Math.min(current + 1, GENERATION_STAGES.length - 1))
        }, 1800)

        return () => window.clearInterval(timer)
    }, [loading])

    useEffect(() => {
        const username = githubUsername.trim()
        if (!username) {
            setGithubPreview(null)
            setGithubWarning('')
            return undefined
        }
        setGithubPreview(null)
        setGithubWarning('')
        let cancelled = false
        const timer = setTimeout(async () => {
            const summary = await fetchGitHubProfile(username)
            if (cancelled) return
            if (summary) setGithubPreview(summary)
            else setGithubWarning(`Couldn't fetch GitHub data for "${username}". You can continue with your resume.`)
        }, 600)
        return () => { cancelled = true; clearTimeout(timer) }
    }, [githubUsername, fetchGitHubProfile])

    useEffect(() => {
        const username = leetcodeUsername.trim()
        if (!username) {
            setLeetcodePreview(null)
            setLeetcodeWarning('')
            return undefined
        }
        setLeetcodePreview(null)
        setLeetcodeWarning('')
        let cancelled = false
        const timer = setTimeout(async () => {
            const summary = await fetchLeetCodeProfile(username)
            if (cancelled) return
            if (summary) setLeetcodePreview(summary)
            else setLeetcodeWarning(`Couldn't fetch LeetCode data for "${username}". You can continue with your resume.`)
        }, 600)
        return () => { cancelled = true; clearTimeout(timer) }
    }, [leetcodeUsername, fetchLeetCodeProfile])

    useEffect(() => {
        const handle = codeforcesHandle.trim()
        if (!handle) {
            setCodeforcesPreview(null)
            setCodeforcesWarning('')
            return undefined
        }
        setCodeforcesPreview(null)
        setCodeforcesWarning('')
        let cancelled = false
        const timer = setTimeout(async () => {
            const summary = await fetchCodeforcesProfile(handle)
            if (cancelled) return
            if (summary) setCodeforcesPreview(summary)
            else setCodeforcesWarning(`Couldn't fetch Codeforces data for "${handle}". You can continue with your resume.`)
        }, 600)
        return () => { cancelled = true; clearTimeout(timer) }
    }, [codeforcesHandle, fetchCodeforcesProfile])

    const handleFileSelect = (event) => {
        const file = event.target.files?.[0]
        if (!file) return

        if (file.type !== 'application/pdf' && !/\.pdf$/i.test(file.name)) {
            setError('Please choose a PDF file.')
            setSelectedFileName('')
            event.target.value = ''
            return
        }

        if (file.size > 5 * 1024 * 1024) {
            setError('This file is over the 5 MB limit. Choose a smaller PDF.')
            setSelectedFileName('')
            event.target.value = ''
            return
        }

        setSelectedFileName(file.name)
        setSelectedResumeId('')
        setSelectedSavedResumeName('')
        setError('')
    }

    const handleGenerateReport = async () => {
        setError('')
        if (!jobDescription.trim()) {
            setError('Add the job description to continue.')
            return
        }

        const resumeFile = resumeInputRef.current?.files?.[0]
        if (!resumeFile && !selectedResumeId && !selfDescription.trim()) {
            setError('Upload a resume PDF or add a short introduction to continue.')
            return
        }

        try {
            const report = await generateReport({
                jobDescription,
                selfDescription,
                resumeFile,
                resumeId: resumeFile ? undefined : selectedResumeId,
                targetCompany,
                interviewDate,
                language,
                githubUsername,
                leetcodeUsername,
                codeforcesHandle,
            })
            navigate(`/interview/${report._id}`)
        } catch (err) {
            const message = err.response?.data?.message || err.response?.data?.error || err.message || 'Could not create your interview plan. Please try again.'
            setError(message)
            console.error('Generate report error:', err)
        }
    }

    const profileWarnings = [githubWarning, leetcodeWarning, codeforcesWarning].filter(Boolean)
    const hasProfilePreview = githubPreview || leetcodePreview || codeforcesPreview

    return (
        <div className='home-page'>
            <AppNavbar />
            <main className='container home-container' aria-busy={loading}>
                <section className='home-hero'>
                    <div className='home-hero__copy'>
                        <span className='home-hero__eyebrow'>PERSONALIZED PREP FOR SOFTWARE INTERVIEWS</span>
                        <h1>Prepare for the interview, not just the application.</h1>
                        <p>Connect your resume, target role, and coding profile to get relevant questions, a focused prep plan, and practical interview feedback.</p>
                        <a className='home-hero__cta' href='#plan-builder'>Build my interview plan <span aria-hidden='true'>→</span></a>
                        <div className='home-hero__steps' aria-label='How SkillMirror works'>
                            <span><b>01</b> Match your role</span>
                            <span><b>02</b> Use your experience</span>
                            <span><b>03</b> Practice answers</span>
                        </div>
                    </div>
                    <aside className='home-hero__visual' aria-label='SkillMirror preparation workflow'>
                        <div className='home-hero__visual-mark' aria-hidden='true'>SM</div>
                        <span className='home-hero__visual-label'>YOUR EXPERIENCE, IN CONTEXT</span>
                        <strong>Turn what you’ve built into interview practice.</strong>
                        <div className='home-hero__signals'>
                            <span>Resume</span><span>Job description</span><span>GitHub</span><span>LeetCode</span>
                        </div>
                        <div className='home-hero__visual-footer'><span aria-hidden='true' /> Tailored to your target role</div>
                    </aside>
                </section>

                <nav className='home-tools' aria-label='Other preparation tools'>
                    <div className='home-tools__intro'><strong>More ways to prepare</strong><span>Pick a tool whenever you need it.</span></div>
                    <Link to='/ai-coach'>Start AI Avatar Interview <span aria-hidden='true'>↗</span></Link>
                    <Link to='/ats'>Check ATS fit <span aria-hidden='true'>↗</span></Link>
                    <Link to='/resumes'>Manage resumes <span aria-hidden='true'>↗</span></Link>
                    <Link to='/gap-analysis'>Explore skill gaps <span aria-hidden='true'>↗</span></Link>
                </nav>

                <header className='home-builder-header'>
                    <span>START HERE</span>
                    <h2>Build your interview plan</h2>
                    <p>Add the role and experience you want to discuss. Optional coding profiles help personalize technical questions.</p>
                </header>

                <Card className='plan-builder' id='plan-builder'>
                    <fieldset className='plan-builder__fields' disabled={loading}>
                        <div className='plan-builder__grid'>
                            <section className='plan-builder__section plan-builder__section--job' aria-labelledby='job-section-title'>
                                <div className='plan-builder__section-heading'>
                                    <span className='plan-builder__step'>01</span>
                                    <div><h3 id='job-section-title'>Target role</h3><p>Start with the job you want.</p></div>
                                    <Badge tone='accent'>Required</Badge>
                                </div>
                                <Textarea
                                    label='Job description'
                                    value={jobDescription}
                                    onChange={(event) => setJobDescription(event.target.value)}
                                    maxLength={5000}
                                    placeholder='Paste the job description, including responsibilities and skills...'
                                    style={{ minHeight: '270px' }}
                                />
                                <div className='plan-builder__counter'>{jobDescription.length} <span>/ 5,000 characters</span></div>
                                <div className='plan-builder__hint'><span aria-hidden='true'>✦</span> A detailed description helps make your questions more relevant.</div>
                            </section>

                            <section className='plan-builder__section plan-builder__section--profile' aria-labelledby='profile-section-title'>
                                <div className='plan-builder__section-heading'>
                                    <span className='plan-builder__step'>02</span>
                                    <div><h3 id='profile-section-title'>Your experience</h3><p>Give the interviewer something real to ask about.</p></div>
                                </div>

                                <div className='resume-upload-block'>
                                    <div className='resume-upload-block__heading'><strong>Resume PDF</strong><span>Optional if you add a short introduction · Up to 5 MB</span></div>
                                    {selectedSavedResumeName && (
                                        <div className='saved-resume-selection'>
                                            <span className='saved-resume-selection__check' aria-hidden='true'>✓</span>
                                            <span><small>Saved resume selected</small><strong>{selectedSavedResumeName}</strong></span>
                                            <button type='button' onClick={() => { setSelectedResumeId(''); setSelectedSavedResumeName('') }}>Remove</button>
                                        </div>
                                    )}
                                    <label htmlFor='resume' className={`resume-drop${selectedFileName ? ' resume-drop--selected' : ''}`}>
                                        <input ref={resumeInputRef} type='file' id='resume' name='resume' accept='.pdf,application/pdf' onChange={handleFileSelect} />
                                        <span className='resume-drop__icon' aria-hidden='true'>{selectedFileName ? '✓' : '↑'}</span>
                                        <span><strong>{selectedFileName || (selectedSavedResumeName ? 'Choose a different resume' : 'Choose a PDF resume')}</strong><small>{selectedFileName ? 'Click to choose a different file' : 'Browse files · PDF only · 5 MB max'}</small></span>
                                    </label>
                                </div>

                                <div className='plan-builder__field-grid'>
                                    <Input label='Target company (optional)' value={targetCompany} onChange={(event) => setTargetCompany(event.target.value)} placeholder='e.g. Google, TCS' />
                                    <Input label='Interview date (optional)' type='date' value={interviewDate} onChange={(event) => setInterviewDate(event.target.value)} />
                                </div>

                                <details className='profile-connectors'>
                                    <summary><span><strong>Add coding profiles</strong><small>Optional · GitHub, LeetCode, Codeforces</small></span><span className='profile-connectors__chevron' aria-hidden='true'>⌄</span></summary>
                                    <div className='profile-connectors__fields'>
                                        <Input label='GitHub username' value={githubUsername} onChange={(event) => setGithubUsername(event.target.value)} placeholder='username' />
                                        <Input label='LeetCode username' value={leetcodeUsername} onChange={(event) => setLeetcodeUsername(event.target.value)} placeholder='username' />
                                        <Input label='Codeforces handle' value={codeforcesHandle} onChange={(event) => setCodeforcesHandle(event.target.value)} placeholder='handle' />
                                    </div>
                                </details>

                                <div className='plan-builder__language'>
                                    <span className='plan-builder__field-label'>Report language</span>
                                    <div className='language-options' role='group' aria-label='Report language'>
                                        {['en', 'hi', 'hinglish'].map((option) => (
                                            <Button key={option} variant={language === option ? 'primary' : 'secondary'} size='sm' aria-pressed={language === option} onClick={() => setLanguage(option)}>
                                                {option === 'en' ? 'English' : option === 'hi' ? 'Hindi' : 'Hinglish'}
                                            </Button>
                                        ))}
                                    </div>
                                </div>

                                <Textarea label='Short introduction (optional)' value={selfDescription} onChange={(event) => setSelfDescription(event.target.value)} placeholder='Add context that may not be clear from your resume...' />
                                <GrammarCheck text={selfDescription} />
                            </section>
                        </div>

                        <div className='plan-builder__footer'>
                            {error && <div className='form-alert' role='alert'><strong>We couldn’t create the plan.</strong><span>{error}</span></div>}
                            <div className='plan-builder__submit-copy'><strong>Ready to prepare?</strong><span>Your report includes role-specific questions and a 5-day preparation plan.</span></div>
                            <Button onClick={handleGenerateReport} disabled={loading} variant='primary' size='lg' className='plan-builder__submit'>
                                {loading ? 'Creating your plan…' : 'Create interview plan'}
                                {!loading && <span aria-hidden='true'>→</span>}
                            </Button>
                        </div>
                    </fieldset>
                </Card>

                {profileWarnings.length > 0 && (
                    <div className='profile-alerts' role='status' aria-live='polite'>
                        {profileWarnings.map((warning) => <div key={warning} className='profile-alert'>{warning}</div>)}
                    </div>
                )}

                {hasProfilePreview && (
                    <section className='profile-previews'>
                        <div className='profile-previews__heading'><div><span>PROFILE CHECK</span><h2>Your coding profile preview</h2></div><p>This public profile data can help personalize your technical questions.</p></div>
                        <div className='profile-previews__grid'>
                            {githubPreview && <GitHubPreviewCard summary={githubPreview} />}
                            {leetcodePreview && <LeetCodePreviewCard summary={leetcodePreview} />}
                            {codeforcesPreview && <CodeforcesPreviewCard summary={codeforcesPreview} />}
                        </div>
                    </section>
                )}

                {reports.length > 0 && (
                    <section className='recent-plans'>
                        <div className='recent-plans__heading'><div><span>YOUR WORKSPACE</span><h2>Recent interview plans</h2></div><Link to='/dashboard'>View progress <span aria-hidden='true'>→</span></Link></div>
                        <div className='recent-plans__list'>
                            {reports.map((report) => (
                                <Link key={report._id} to={`/interview/${report._id}`} className='recent-plan-link'>
                                    <Card interactive className='recent-plan-card'>
                                        <div className='recent-plan-card__main'>
                                            <span className='recent-plan-card__icon' aria-hidden='true'>↗</span>
                                            <div><strong>{report.title || 'Untitled Position'}</strong><span>Created {new Date(report.createdAt).toLocaleDateString()}</span></div>
                                        </div>
                                        <Badge tone={report.matchScore >= 80 ? 'success' : report.matchScore >= 60 ? 'warning' : 'danger'}>{report.matchScore}% match</Badge>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                <footer className='home-footer'><span>SkillMirror · Personalized practice for your next interview</span><Link to='/about'>About SkillMirror</Link></footer>
            </main>

            <Modal open={loading} title='Creating your interview plan' className='plan-generation-modal'>
                <div className='plan-generation' role='status' aria-live='polite' aria-atomic='true'>
                    <div className='plan-generation__visual' aria-hidden='true'>
                        <span className='plan-generation__orbit plan-generation__orbit--outer' />
                        <span className='plan-generation__orbit plan-generation__orbit--inner' />
                        <div className='plan-generation__document'><i /><i /><i /><b>✓</b></div>
                    </div>
                    <div className='plan-generation__copy'>
                        <span className='plan-generation__eyebrow'>SkillMirror is at work</span>
                        <strong>{GENERATION_STAGES[generationStage].title}</strong>
                        <p>{GENERATION_STAGES[generationStage].description}</p>
                    </div>
                    <ol className='plan-generation__steps' aria-label='Plan creation stages'>
                        {GENERATION_STAGES.map((stage, index) => {
                            const stepState = index < generationStage ? 'complete' : index === generationStage ? 'active' : 'upcoming'
                            return (
                                <li key={stage.title} className={`plan-generation__step plan-generation__step--${stepState}`}>
                                    <span aria-hidden='true'>{stepState === 'complete' ? '✓' : index + 1}</span>
                                    <span>{stage.title}</span>
                                </li>
                            )
                        })}
                    </ol>
                    <div className='plan-generation__note'>
                        <span className='plan-generation__spinner' aria-hidden='true' />
                        <span>Your role and experience are being shaped into focused practice.</span>
                    </div>
                </div>
            </Modal>
        </div>
    )
}

export default Home

const GitHubPreviewCard = ({ summary }) => (
    <div className='preview-card'>
        <div className='preview-card__header'><span className='preview-card__title'>GitHub</span><strong className='preview-card__username'>{summary.username}</strong></div>
        {summary.repos?.length ? (
            <ul className='preview-repos'>
                {summary.repos.map((repo) => (
                    <li key={repo.name} className='preview-repo'>
                        <div className='preview-repo__row'><span className='preview-repo__name'>{repo.name}</span>{repo.language && <span className='lang-chip'>{repo.language}</span>}{repo.stars > 0 && <span className='star-count'>★ {repo.stars}</span>}</div>
                        {repo.description && <p className='preview-repo__desc'>{repo.description}</p>}
                    </li>
                ))}
            </ul>
        ) : <p className='preview-card__empty'>No public repositories found for this account.</p>}
    </div>
)

const CodeforcesPreviewCard = ({ summary }) => (
    <div className='preview-card'>
        <div className='preview-card__header'><span className='preview-card__title'>Codeforces</span><strong className='preview-card__username'>{summary.handle}</strong></div>
        <div className='codeforces-stats'>
            {[['Rating', summary.rating || 0], ['Max rating', summary.maxRating || 0], ['Rank', summary.rank || '—'], ['Solved', summary.totalSolved || 0]].map(([label, value]) => (
                <div key={label} className='codeforces-stat'><span className='codeforces-stat__label'>{label}</span><span className='codeforces-stat__value'>{value}</span></div>
            ))}
        </div>
        {summary.tagWise?.length > 0 && <div className='leetcode-topics'><span className='leetcode-topics__label'>Top topics</span><div className='leetcode-topics__chips'>{summary.tagWise.slice(0, 6).map((topic) => <span key={topic.tag} className='lang-chip'>{topic.tag} ({topic.solved})</span>)}</div></div>}
    </div>
)

const LeetCodePreviewCard = ({ summary }) => {
    const difficultyCounts = ['Easy', 'Medium', 'Hard'].map((level) => ({
        level,
        value: Number(summary[level.toLowerCase()]) || 0,
    }))
    const solvedCount = difficultyCounts.reduce((total, item) => total + item.value, 0)
    let previousStop = 0
    const chartStops = difficultyCounts.map(({ level, value }) => {
        const nextStop = solvedCount ? previousStop + value / solvedCount * 100 : 0
        const stop = `${LEETCODE_COLORS[level]} ${previousStop}% ${nextStop}%`
        previousStop = nextStop
        return stop
    })
    const chartBackground = solvedCount
        ? `conic-gradient(${chartStops.join(', ')})`
        : 'conic-gradient(var(--color-border) 0% 100%)'

    return (
        <div className='preview-card'>
            <div className='preview-card__header'><span className='preview-card__title'>LeetCode</span><strong className='preview-card__username'>{summary.username}</strong></div>
            <div className='leetcode-preview'>
                <div className='leetcode-chart'>
                    <div className='leetcode-chart__ring' style={{ background: chartBackground }} />
                    <div className='leetcode-chart__center'><strong>{summary.totalSolved}</strong><span>solved</span></div>
                </div>
                <div className='leetcode-stats'>
                    {['Easy', 'Medium', 'Hard'].map((level) => <div key={level} className='leetcode-stat'><span className='leetcode-stat__dot' style={{ background: LEETCODE_COLORS[level] }} /><span className='leetcode-stat__label'>{level}</span><span className='leetcode-stat__value'>{summary[level.toLowerCase()]}</span></div>)}
                    {summary.topTopics?.length > 0 && <div className='leetcode-topics'><span className='leetcode-topics__label'>Top topics</span><div className='leetcode-topics__chips'>{summary.topTopics.map((topic) => <span key={topic.tag} className='lang-chip'>{topic.tag} ({topic.solved})</span>)}</div></div>}
                </div>
            </div>
        </div>
    )
}
