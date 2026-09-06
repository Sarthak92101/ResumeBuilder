import React, { useState, useRef, useEffect } from 'react'
import "../style/home.scss"
import { useInterview } from '../hooks/useInterview.js'
import { useNavigate, Link } from 'react-router'
import AppNavbar from '../../../components/AppNavbar'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

const LEETCODE_COLORS = { Easy: '#22c55e', Medium: '#f59e0b', Hard: '#ef4444' }

const Home = () => {

    const { loading, generateReport, reports, fetchGitHubProfile, fetchLeetCodeProfile } = useInterview()
    const [ jobDescription, setJobDescription ] = useState("")
    const [ selfDescription, setSelfDescription ] = useState("")
    const [ targetCompany, setTargetCompany ] = useState("")
    const [ interviewDate, setInterviewDate ] = useState("")
    const [ language, setLanguage ] = useState("en")
    const [ error, setError ] = useState("")
    const [ selectedFileName, setSelectedFileName ] = useState("")
    const [ githubUsername, setGithubUsername ] = useState("")
    const [ leetcodeUsername, setLeetcodeUsername ] = useState("")
    const [ githubPreview, setGithubPreview ] = useState(null)
    const [ leetcodePreview, setLeetcodePreview ] = useState(null)
    const [ githubWarning, setGithubWarning ] = useState("")
    const [ leetcodeWarning, setLeetcodeWarning ] = useState("")
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

            {/* Page Header */}
            <header className='page-header'>
                <h1>Create Your Custom <span className='highlight'>Interview Plan</span></h1>
                <p>Let our AI analyze the job requirements and your unique profile to build a winning strategy.</p>
            </header>

            {/* Main Card */}
            <div className='interview-card'>
                <div className='interview-card__body'>

                    {/* Left Panel - Job Description */}
                    <div className='panel panel--left'>
                        <div className='panel__header'>
                            <span className='panel__icon'>
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
                            </span>
                            <h2>Target Job Description</h2>
                            <span className='badge badge--required'>Required</span>
                        </div>
                        <textarea
                            onChange={(e) => { setJobDescription(e.target.value) }}
                            className='panel__textarea'
                            placeholder={`Paste the full job description here...\ne.g. 'Senior Frontend Engineer at Google requires proficiency in React, TypeScript, and large-scale system design...'`}
                            maxLength={5000}
                        />
                        <div className='char-counter'>{jobDescription.length} / 5000 chars</div>
                    </div>

                    {/* Vertical Divider */}
                    <div className='panel-divider' />

                    {/* Right Panel - Profile */}
                    <div className='panel panel--right'>
                        <div className='panel__header'>
                            <span className='panel__icon'>
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                            </span>
                            <h2>Your Profile</h2>
                        </div>

                        {/* Upload Resume */}
                        <div className='upload-section'>
                            <label className='section-label'>
                                Upload Resume
                                <span className='badge badge--best'>Best Results</span>
                            </label>
                            <label className='dropzone' htmlFor='resume'>
                                <span className='dropzone__icon'>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16" /><line x1="12" y1="12" x2="12" y2="21" /><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" /></svg>
                                </span>
                                <p className='dropzone__title'>Click to upload or drag &amp; drop</p>
                                <p className='dropzone__subtitle'>PDF (Max 5MB)</p>
                                <input 
                                    ref={resumeInputRef} 
                                    hidden 
                                    type='file' 
                                    id='resume' 
                                    name='resume' 
                                    accept='.pdf'
                                    onChange={handleFileSelect}
                                />
                                {selectedFileName && <p className='dropzone__selected-name'><strong>{selectedFileName}</strong></p>}
                            </label>
                        </div>

                        {/* OR Divider */}
                        <div className='or-divider'><span>OR</span></div>

                        {/* Company + Interview Date */}
                        <div className='company-meta'>
                            <label className='section-label' htmlFor='targetCompany'>Target Company</label>
                            <input
                                id='targetCompany'
                                value={targetCompany}
                                onChange={(e) => setTargetCompany(e.target.value)}
                                className='panel__input'
                                placeholder='Amazon, TCS, Infosys, etc.'
                            />
                        </div>
                        <div className='company-meta'>
                            <label className='section-label' htmlFor='interviewDate'>Interview Date</label>
                            <input
                                id='interviewDate'
                                type='date'
                                value={interviewDate}
                                onChange={(e) => setInterviewDate(e.target.value)}
                                className='panel__input'
                            />
                        </div>

                        {/* Optional Developer Profiles */}
                        <div className='dev-profile'>
                            <div className='dev-profile__header'>
                                <span className='section-label'>Developer Profiles <span className='badge badge--optional'>Optional</span></span>
                                <span className='dev-profile__hint'>Add GitHub / LeetCode usernames for repo-specific and DSA questions.</span>
                            </div>
                            <label className='company-meta'>
                                <span className='section-label' htmlFor='githubUsername'>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
                                    GitHub username
                                </span>
                                <input
                                    id='githubUsername'
                                    value={githubUsername}
                                    onChange={(e) => setGithubUsername(e.target.value)}
                                    className='panel__input'
                                    placeholder='octocat'
                                    autoComplete='off'
                                />
                            </label>
                            {githubUsername.trim() && githubWarning && <div className='preview-warning'>{githubWarning}</div>}
                            {githubPreview && githubPreview.username === githubUsername.trim() && <GitHubPreviewCard summary={githubPreview} />}

                            <label className='company-meta'>
                                <span className='section-label' htmlFor='leetcodeUsername'>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125.513 5.527 5.527 0 0 0 .062 2.362 5.83 5.83 0 0 0 .349 1.017 5.938 5.938 0 0 0 1.271 1.818l4.277 4.193.039.038c2.248 2.165 5.852 2.133 8.063-.074l2.396-2.392c.54-.54.54-1.414.003-1.955a1.378 1.378 0 0 0-1.951-.003l-2.396 2.392a3.021 3.021 0 0 1-4.205.038l-.02-.019-4.276-4.193c-.652-.64-.972-1.469-.948-2.263a2.68 2.68 0 0 1 .066-.523 2.545 2.545 0 0 1 .619-1.164L9.13 8.114c1.058-1.134 3.204-1.27 4.43-.278l3.501 2.831c.593.48 1.461.387 1.94-.207a1.384 1.384 0 0 0-.207-1.943l-3.5-2.831c-.8-.647-1.766-1.045-2.774-1.202l2.015-2.158A1.384 1.384 0 0 0 13.483 0zm-2.866 12.815a1.38 1.38 0 0 0-1.38 1.382 1.38 1.38 0 0 0 1.38 1.382H20.79a1.38 1.38 0 0 0 1.38-1.382 1.38 1.38 0 0 0-1.38-1.382z"/></svg>
                                    LeetCode username
                                </span>
                                <input
                                    id='leetcodeUsername'
                                    value={leetcodeUsername}
                                    onChange={(e) => setLeetcodeUsername(e.target.value)}
                                    className='panel__input'
                                    placeholder='johndoe'
                                    autoComplete='off'
                                />
                            </label>
                            {leetcodeUsername.trim() && leetcodeWarning && <div className='preview-warning'>{leetcodeWarning}</div>}
                            {leetcodePreview && leetcodePreview.username === leetcodeUsername.trim() && <LeetCodePreviewCard summary={leetcodePreview} />}
                        </div>

                        {/* Language Toggle */}
                        <div className='company-meta'>
                            <label className='section-label'>Language</label>
                            <div className='language-toggle'>
                                {[
                                    { value: 'en', label: 'English' },
                                    { value: 'hi', label: 'Hindi' },
                                    { value: 'hinglish', label: 'Hinglish' },
                                ].map(opt => (
                                    <button
                                        key={opt.value}
                                        type='button'
                                        className={`language-toggle__btn ${language === opt.value ? 'language-toggle__btn--active' : ''}`}
                                        onClick={() => setLanguage(opt.value)}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Quick Self-Description */}
                        <div className='self-description'>
                            <label className='section-label' htmlFor='selfDescription'>Quick Self-Description</label>
                            <textarea
                                onChange={(e) => { setSelfDescription(e.target.value) }}
                                id='selfDescription'
                                name='selfDescription'
                                className='panel__textarea panel__textarea--short'
                                placeholder="Briefly describe your experience, key skills, and years of experience if you don't have a resume handy..."
                            />
                        </div>

                        {/* Info Box */}
                        <div className='info-box'>
                            <span className='info-box__icon'>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" stroke="#1a1f27" strokeWidth="2" /><line x1="12" y1="16" x2="12.01" y2="16" stroke="#1a1f27" strokeWidth="2" /></svg>
                            </span>
                            <p>Either a <strong>Resume</strong> or a <strong>Self Description</strong> is required to generate a personalized plan. GitHub &amp; LeetCode are optional.</p>
                        </div>
                    </div>
                </div>

            <div className='interview-card__footer'>
                {error && <div className='home-error'>{error}</div>}
                <span className='footer-info'>AI-Powered Strategy Generation &bull; Approx 30s</span>
                <button
                    onClick={handleGenerateReport}
                    disabled={loading}
                    className='generate-btn'>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" /></svg>
                    {loading ? 'Generating...' : 'Generate My Interview Strategy'}
                </button>
            </div>
            </div>

            {/* Recent Reports List */}
            {reports.length > 0 && (
                <section className='recent-reports'>
                    <h2>My Recent Interview Plans</h2>
                    <ul className='reports-list'>
                        {reports.map(report => (
                            <li key={report._id} className='report-item' onClick={() => navigate(`/interview/${report._id}`)}>
                                <h3>{report.title || 'Untitled Position'}</h3>
                                <p className='report-meta'>Generated on {new Date(report.createdAt).toLocaleDateString()}</p>
                                <p className={`match-score ${report.matchScore >= 80 ? 'score--high' : report.matchScore >= 60 ? 'score--mid' : 'score--low'}`}>Match Score: {report.matchScore}%</p>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {/* Page Footer */}
            <footer className='page-footer'>
                <Link to='/about'>About Me</Link>
            </footer>
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

// ── Preview card: LeetCode ────────────────────────────────────────────────────
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