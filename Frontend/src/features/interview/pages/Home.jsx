import React, { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import AppNavbar from '../../../components/AppNavbar'
import { Badge, Button, Card, Input, Textarea } from '../../../components/ui'
import LoadingExperience from '../../../components/ui/LoadingExperience.jsx'
import { setActiveResumeId } from '../../resume/services/activeResume'
import { uploadResume } from '../../resume/services/resume.api'
import GrammarCheck from '../components/GrammarCheck'
import { useInterview } from '../hooks/useInterview.js'
import '../style/home.scss'
import '../style/preview.scss'

const LEETCODE_COLORS = { Easy: '#22c55e', Medium: '#f59e0b', Hard: '#ef4444' }

const Home = () => {
    const { loading, generateReport, reports, fetchGitHubProfile, fetchLeetCodeProfile, fetchCodeforcesProfile } = useInterview()
    const [jobDescription, setJobDescription] = useState('')
    const [selfDescription, setSelfDescription] = useState('')
    const [targetCompany, setTargetCompany] = useState('')
    const [interviewDate, setInterviewDate] = useState('')
    const [language, setLanguage] = useState('en')
    const [error, setError] = useState('')
    const [selectedFileName, setSelectedFileName] = useState('')
    const [selectedResumeId, setSelectedResumeId] = useState('')
    const [resumeUploading, setResumeUploading] = useState(false)
    const [githubUsername, setGithubUsername] = useState('')
    const [leetcodeUsername, setLeetcodeUsername] = useState('')
    const [codeforcesHandle, setCodeforcesHandle] = useState('')
    const [githubPreview, setGithubPreview] = useState(null)
    const [leetcodePreview, setLeetcodePreview] = useState(null)
    const [codeforcesPreview, setCodeforcesPreview] = useState(null)
    const [githubWarning, setGithubWarning] = useState('')
    const [leetcodeWarning, setLeetcodeWarning] = useState('')
    const [codeforcesWarning, setCodeforcesWarning] = useState('')
    const resumeInputRef = useRef(null)
    const navigate = useNavigate()

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

    const handleFileSelect = async (event) => {
        const file = event.target.files?.[0]
        if (!file) return
        setSelectedResumeId('')
        setSelectedFileName('')

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
        setError('')

        setResumeUploading(true)
        try {
            const response = await uploadResume(file)
            const resumeId = response.resume?._id
            if (!resumeId) throw new Error('The CV could not be saved. Please try uploading it again.')
            setSelectedResumeId(resumeId)
            setSelectedFileName(response.resume.fileName || file.name)
            setActiveResumeId(resumeId)
        } catch (uploadError) {
            setSelectedFileName('')
            event.target.value = ''
            setError(uploadError.response?.data?.message || uploadError.message || 'Could not upload your CV. Please try again.')
        } finally {
            setResumeUploading(false)
        }
    }

    const handleGenerateReport = async () => {
        setError('')
        if (!jobDescription.trim()) {
            setError('Add the job description to continue.')
            return
        }

        if (!selectedResumeId) {
            setError('Upload your CV as a PDF to create an interview plan.')
            return
        }

        try {
            const report = await generateReport({
                jobDescription,
                selfDescription,
                resumeId: selectedResumeId,
                targetCompany,
                interviewDate,
                language,
                githubUsername,
                leetcodeUsername,
                codeforcesHandle,
            })
            const activeResumeId = report.resumeId || selectedResumeId
            if (activeResumeId) setActiveResumeId(activeResumeId)
            navigate(`/interview/${report._id}`, { state: { resumeId: activeResumeId, fileName: selectedFileName } })
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
            <main className='container home-container' aria-busy={loading || resumeUploading}>
                <header className='home-workspace-heading'>
                    <span>YOUR INTERVIEW WORKSPACE</span>
                    <h1>Prepare for your next interview</h1>
                    <p>Add a job description and upload a CV. SkillMirror will build a focused practice plan around your experience.</p>
                </header>

                <Card className='plan-builder' id='plan-builder'>
                    <fieldset className='plan-builder__fields' disabled={loading || resumeUploading}>
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
                                    <div className='resume-upload-block__heading'><strong>Your CV</strong><span>Upload a PDF for each plan · It becomes your active CV across SAVIK, ATS, and skill gap analysis</span></div>
                                    <label htmlFor='resume' className={`resume-drop${selectedFileName ? ' resume-drop--selected' : ''}`}>
                                        <input ref={resumeInputRef} type='file' id='resume' name='resume' accept='.pdf,application/pdf' aria-required='true' onChange={handleFileSelect} />
                                        <span className='resume-drop__icon' aria-hidden='true'>{selectedFileName ? '✓' : '↑'}</span>
                                        <span><strong>{selectedFileName || 'Upload your CV PDF'}</strong><small>{resumeUploading ? 'Saving CV to your resume library…' : selectedResumeId ? 'Saved and active across your resume tools' : 'Required for every new plan · PDF only · 5 MB max'}</small></span>
                                    </label>
                                </div>

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

                                <details className='plan-builder__advanced'>
                                    <summary><span><strong>Personalize further</strong><small>Optional · company, date, coding profiles, or extra context</small></span><span aria-hidden='true'>⌄</span></summary>
                                    <div className='plan-builder__advanced-content'>
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

                                        <Textarea label='Short introduction (optional)' value={selfDescription} onChange={(event) => setSelfDescription(event.target.value)} placeholder='Add context that may not be clear from your resume...' />
                                        <GrammarCheck text={selfDescription} />
                                    </div>
                                </details>
                            </section>
                        </div>

                        <div className='plan-builder__footer'>
                            {error && <div className='form-alert' role='alert'><strong>We couldn’t create the plan.</strong><span>{error}</span></div>}
                            <div className='plan-builder__submit-copy'><strong>Ready to prepare?</strong><span>Your report includes role-specific questions and a 5-day preparation plan.</span></div>
                            <Button onClick={handleGenerateReport} disabled={loading || resumeUploading} variant='primary' size='lg' className='plan-builder__submit'>
                                {resumeUploading ? 'Saving your CV…' : loading ? 'Creating your plan…' : 'Create interview plan'}
                                {!loading && !resumeUploading && <span aria-hidden='true'>→</span>}
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
            {loading && <LoadingExperience title='Analyzing your resume and preparing your plan' overlay />}
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
