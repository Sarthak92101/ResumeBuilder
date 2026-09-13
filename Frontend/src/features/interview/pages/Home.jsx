import React, { useState, useRef, useEffect } from 'react'
import { useInterview } from '../hooks/useInterview.js'
import { useNavigate, Link } from 'react-router'
import AppNavbar from '../../../components/AppNavbar'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { Card, PageHeader, Button, Badge, Input, Textarea } from '../../../components/ui'
import GrammarCheck from '../components/GrammarCheck'
import '../style/preview.scss'

const LEETCODE_COLORS = { Easy: '#22c55e', Medium: '#f59e0b', Hard: '#ef4444' }

const Home = () => {

    const { loading, generateReport, reports, fetchGitHubProfile, fetchLeetCodeProfile, fetchCodeforcesProfile } = useInterview()
    const [ jobDescription, setJobDescription ] = useState("")
    const [ selfDescription, setSelfDescription ] = useState("")
    const [ targetCompany, setTargetCompany ] = useState("")
    const [ interviewDate, setInterviewDate ] = useState("")
    const [ language, setLanguage ] = useState("en")
    const [ error, setError ] = useState("")
    const [ selectedFileName, setSelectedFileName ] = useState("")
    const [ githubUsername, setGithubUsername ] = useState("")
    const [ leetcodeUsername, setLeetcodeUsername ] = useState("")
    const [ codeforcesHandle, setCodeforcesHandle ] = useState("")
    const [ githubPreview, setGithubPreview ] = useState(null)
    const [ leetcodePreview, setLeetcodePreview ] = useState(null)
    const [ codeforcesPreview, setCodeforcesPreview ] = useState(null)
    const [ githubWarning, setGithubWarning ] = useState("")
    const [ leetcodeWarning, setLeetcodeWarning ] = useState("")
    const [ codeforcesWarning, setCodeforcesWarning ] = useState("")
    const resumeInputRef = useRef()

    const navigate = useNavigate()

    // Debounced preview fetches — failures are non-blocking.
    // Previews/warnings are only rendered when they match the current username,
    // so stale data never shows while a user is typing.
    useEffect(() => {
        const username = githubUsername.trim()
        if (!username) return
        let cancelled = false
        const timer = setTimeout(async () => {
            const summary = await fetchGitHubProfile(username)
            if (cancelled) return
            if (summary) {
                setGithubPreview(summary)
                setGithubWarning("")
            } else {
                setGithubPreview(null)
                setGithubWarning(`Couldn't fetch GitHub data for "${username}", continuing with resume only.`)
            }
        }, 600)
        return () => { cancelled = true; clearTimeout(timer) }
    }, [githubUsername, fetchGitHubProfile])

    useEffect(() => {
        const username = leetcodeUsername.trim()
        if (!username) return
        let cancelled = false
        const timer = setTimeout(async () => {
            const summary = await fetchLeetCodeProfile(username)
            if (cancelled) return
            if (summary) {
                setLeetcodePreview(summary)
                setLeetcodeWarning("")
            } else {
                setLeetcodePreview(null)
                setLeetcodeWarning(`Couldn't fetch LeetCode data for "${username}", continuing with resume only.`)
            }
        }, 600)
        return () => { cancelled = true; clearTimeout(timer) }
    }, [leetcodeUsername, fetchLeetCodeProfile])

    useEffect(() => {
        const handle = codeforcesHandle.trim()
        if (!handle) return
        let cancelled = false
        const timer = setTimeout(async () => {
            const summary = await fetchCodeforcesProfile(handle)
            if (cancelled) return
            if (summary) {
                setCodeforcesPreview(summary)
                setCodeforcesWarning("")
            } else {
                setCodeforcesPreview(null)
                setCodeforcesWarning(`Couldn't fetch Codeforces data for "${handle}", continuing with resume only.`)
            }
        }, 600)
        return () => { cancelled = true; clearTimeout(timer) }
    }, [codeforcesHandle, fetchCodeforcesProfile])

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0]
        if (file) {
            // Validate file type - only PDF
            if (file.type !== 'application/pdf') {
                setError("Please select a PDF file")
                setSelectedFileName("")
                resumeInputRef.current.value = ""
                return
            }
            
            // Validate file size (5MB)
            if (file.size > 5 * 1024 * 1024) {
                setError("File size must be less than 5MB")
                setSelectedFileName("")
                resumeInputRef.current.value = ""
                return
            }
            
            setSelectedFileName(file.name)
            setError("")
        }
    }

    const handleGenerateReport = async () => {
        try {
            setError("")
            
            // Validation
            if (!jobDescription.trim()) {
                setError("Please enter a job description")
                return
            }
            
            const resumeFile = resumeInputRef.current?.files?.[0]
            if (!resumeFile && !selfDescription.trim()) {
                setError("Please upload a resume or provide a self-description")
                return
            }

            const data = await generateReport({
                jobDescription,
                selfDescription,
                resumeFile,
                targetCompany,
                interviewDate,
                language,
                githubUsername,
                leetcodeUsername,
                codeforcesHandle,
            })
            navigate(`/interview/${data._id}`)
        } catch (err) {
            const message =
                err.response?.data?.message ||
                err.response?.data?.error ||
                err.message ||
                "Failed to generate interview strategy"
            setError(message)
            console.error("Generate report error:", err)
        }
    }

    if (loading) {
        return (
            <main className='loading-screen'>
                <h1>The system is loading your interview plan...</h1>
            </main>
        )
    }

    return (
        <div className='home-page'>
            <AppNavbar />
            <main className='container'>
                <PageHeader title='Create Your Custom Interview Plan' subtitle='Let our AI analyze the job requirements and your unique profile to build a winning strategy.' />

                <Card style={{ padding: 'var(--space-5)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 'var(--space-5)' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
                                <h2 style={{ margin: 0 }}>Target Job Description</h2>
                                <Badge tone='accent'>Required</Badge>
                            </div>
                            <Textarea value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} maxLength={5000} placeholder={`Paste the full job description here...`} style={{ minHeight: '260px' }} />
                            <div style={{ marginTop: 'var(--space-2)', textAlign: 'right', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>{jobDescription.length} / 5000 chars</div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
                                <h2 style={{ margin: 0 }}>Your Profile</h2>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span style={{ fontWeight: 600, color: 'var(--color-text-secondary)' }}>Upload Resume</span>
                                    <Badge tone='accent'>Best Results</Badge>
                                </div>
                                <label htmlFor='resume' style={{ display: 'grid', placeItems: 'center', minHeight: '80px', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-accent-soft)', color: 'var(--color-text-secondary)', textAlign: 'center', cursor: 'pointer' }}>
                                    <span>Upload PDF</span>
                                    <input ref={resumeInputRef} hidden type='file' id='resume' name='resume' accept='.pdf' onChange={handleFileSelect} />
                                    {selectedFileName && <strong style={{ color: 'var(--color-text-primary)' }}>{selectedFileName}</strong>}
                                </label>
                            </div>

                            <Input label='Target Company' value={targetCompany} onChange={(e) => setTargetCompany(e.target.value)} placeholder='Amazon, TCS, Infosys, etc.' />
                            <Input label='Interview Date' type='date' value={interviewDate} onChange={(e) => setInterviewDate(e.target.value)} />

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                                <span style={{ fontWeight: 600, color: 'var(--color-text-secondary)' }}>Developer Profiles</span>
                                <Input value={githubUsername} onChange={(e) => setGithubUsername(e.target.value)} placeholder='GitHub username' />
                                <Input value={leetcodeUsername} onChange={(e) => setLeetcodeUsername(e.target.value)} placeholder='LeetCode username' />
                                <Input value={codeforcesHandle} onChange={(e) => setCodeforcesHandle(e.target.value)} placeholder='Codeforces handle' />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                                <span style={{ fontWeight: 600, color: 'var(--color-text-secondary)' }}>Language</span>
                                <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                                    {['en', 'hi', 'hinglish'].map(option => (
                                        <Button key={option} variant={language === option ? 'primary' : 'secondary'} size='sm' onClick={() => setLanguage(option)}>
                                            {option === 'en' ? 'English' : option === 'hi' ? 'Hindi' : 'Hinglish'}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            <Textarea label='Quick Self-Description' value={selfDescription} onChange={(e) => setSelfDescription(e.target.value)} placeholder="Briefly describe your experience and key skills..." />
                            <GrammarCheck text={selfDescription} />
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-4)', marginTop: 'var(--space-5)', flexWrap: 'wrap' }}>
                        {error && <div style={{ color: 'var(--color-danger)', background: 'rgba(229,72,77,0.08)', border: '1px solid rgba(229,72,77,0.2)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)', flex: 1 }}>{error}</div>}
                        <Button onClick={handleGenerateReport} disabled={loading} variant='primary' size='lg'>
                            {loading ? 'Generating...' : 'Generate My Interview Strategy'}
                        </Button>
                    </div>
                </Card>

                {(githubWarning || leetcodeWarning || codeforcesWarning) && (
                    <div style={{ marginTop: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                        {[githubWarning, leetcodeWarning, codeforcesWarning].filter(Boolean).map((w, i) => (
                            <div key={i} style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', background: 'rgba(245,166,35,0.08)', color: 'var(--color-warning)', border: '1px solid rgba(245,166,35,0.2)', fontSize: '0.8rem' }}>{w}</div>
                        ))}
                    </div>
                )}

                {(githubPreview || leetcodePreview || codeforcesPreview) && (
                    <section style={{ marginTop: 'var(--space-6)' }}>
                        <h2 style={{ marginBottom: 'var(--space-4)' }}>Developer Profile Previews</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)', alignItems: 'start' }}>
                            {githubPreview && <GitHubPreviewCard summary={githubPreview} />}
                            {leetcodePreview && <LeetCodePreviewCard summary={leetcodePreview} />}
                            {codeforcesPreview && <CodeforcesPreviewCard summary={codeforcesPreview} />}
                        </div>
                    </section>
                )}

                {reports.length > 0 && (
                    <section style={{ marginTop: 'var(--space-6)' }}>
                        <h2 style={{ marginBottom: 'var(--space-4)' }}>My Recent Interview Plans</h2>
                        <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
                            {reports.map(report => (
                                <Card key={report._id} interactive onClick={() => navigate(`/interview/${report._id}`)} style={{ padding: 'var(--space-4)', cursor: 'pointer' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                                        <div>
                                            <div style={{ fontWeight: 700 }}>{report.title || 'Untitled Position'}</div>
                                            <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>Generated on {new Date(report.createdAt).toLocaleDateString()}</div>
                                        </div>
                                        <Badge tone={report.matchScore >= 80 ? 'success' : report.matchScore >= 60 ? 'warning' : 'danger'}>Match Score: {report.matchScore}%</Badge>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </section>
                )}

                <div style={{ marginTop: 'var(--space-7)', textAlign: 'center' }}>
                    <Link to='/about' style={{ color: 'var(--color-text-secondary)', textDecoration: 'none' }}>About Me</Link>
                </div>
            </main>
        </div>
    )
}

export default Home

// ── Preview card: GitHub ──────────────────────────────────────────────────────
const GitHubPreviewCard = ({ summary }) => (
    <div className='preview-card'>
        <div className='preview-card__header'>
            <span className='preview-card__title'>GitHub Profile</span>
            <strong className='preview-card__username'>{summary.username}</strong>
        </div>
        {summary.repos?.length ? (
            <ul className='preview-repos'>
                {summary.repos.map(repo => (
                    <li key={repo.name} className='preview-repo'>
                        <div className='preview-repo__row'>
                            <span className='preview-repo__name'>{repo.name}</span>
                            {repo.language && <span className='lang-chip'>{repo.language}</span>}
                            {repo.stars > 0 && <span className='star-count'>&#9733; {repo.stars}</span>}
                        </div>
                        {repo.description && <p className='preview-repo__desc'>{repo.description}</p>}
                    </li>
                ))}
            </ul>
        ) : (
            <p className='preview-card__empty'>No public repositories found for this account.</p>
        )}
    </div>
)

// ── Preview card: Codeforces ──────────────────────────────────────────────────
const CodeforcesPreviewCard = ({ summary }) => (
    <div className='preview-card'>
        <div className='preview-card__header'>
            <span className='preview-card__title'>Codeforces Profile</span>
            <strong className='preview-card__username'>{summary.handle}</strong>
        </div>
        <div className='codeforces-stats'>
            <div className='codeforces-stat'>
                <span className='codeforces-stat__label'>Rating</span>
                <span className='codeforces-stat__value'>{summary.rating || 0}</span>
            </div>
            <div className='codeforces-stat'>
                <span className='codeforces-stat__label'>Max Rating</span>
                <span className='codeforces-stat__value'>{summary.maxRating || 0}</span>
            </div>
            <div className='codeforces-stat'>
                <span className='codeforces-stat__label'>Rank</span>
                <span className='codeforces-stat__value'>{summary.rank || '—'}</span>
            </div>
            <div className='codeforces-stat'>
                <span className='codeforces-stat__label'>Solved</span>
                <span className='codeforces-stat__value'>{summary.totalSolved || 0}</span>
            </div>
        </div>
        {summary.tagWise?.length > 0 && (
            <div className='leetcode-topics'>
                <span className='leetcode-topics__label'>Top topics:</span>
                <div className='leetcode-topics__chips'>
                    {summary.tagWise.slice(0, 6).map(topic => (
                        <span key={topic.tag} className='lang-chip'>{topic.tag} ({topic.solved})</span>
                    ))}
                </div>
            </div>
        )}
    </div>
)
const LeetCodePreviewCard = ({ summary }) => {
    const pieData = ['Easy', 'Medium', 'Hard']
        .filter(level => summary[level.toLowerCase()] > 0)
        .map(level => ({
            name: level,
            value: summary[level.toLowerCase()],
            color: LEETCODE_COLORS[level],
        }))

    return (
        <div className='preview-card'>
            <div className='preview-card__header'>
                <span className='preview-card__title'>LeetCode Profile</span>
                <strong className='preview-card__username'>{summary.username}</strong>
            </div>
            <div className='leetcode-preview'>
                <div className='leetcode-chart'>
                    <ResponsiveContainer width='100%' height='100%'>
                        <PieChart>
                            <Pie
                                data={pieData}
                                dataKey='value'
                                nameKey='name'
                                innerRadius={32}
                                outerRadius={50}
                                paddingAngle={2}
                                strokeWidth={0}
                            >
                                {pieData.map(entry => (
                                    <Cell key={entry.name} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className='leetcode-chart__center'>
                        <strong>{summary.totalSolved}</strong>
                        <span>solved</span>
                    </div>
                </div>
                <div className='leetcode-stats'>
                    {['Easy', 'Medium', 'Hard'].map(level => (
                        <div key={level} className='leetcode-stat'>
                            <span className='leetcode-stat__dot' style={{ background: LEETCODE_COLORS[level] }} />
                            <span className='leetcode-stat__label'>{level}</span>
                            <span className='leetcode-stat__value'>{summary[level.toLowerCase()]}</span>
                        </div>
                    ))}
                    {summary.topTopics?.length > 0 && (
                        <div className='leetcode-topics'>
                            <span className='leetcode-topics__label'>Top topics:</span>
                            <div className='leetcode-topics__chips'>
                                {summary.topTopics.map(topic => (
                                    <span key={topic.tag} className='lang-chip'>{topic.tag} ({topic.solved})</span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}