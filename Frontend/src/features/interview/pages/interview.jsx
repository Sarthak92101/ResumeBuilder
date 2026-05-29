import React, { useState, useEffect } from 'react'
import '../style/interview.scss'
import { useParams } from 'react-router'

// ─────────────────────────────────────────────────────────────────────
// Question Card Component
// ─────────────────────────────────────────────────────────────────────
const QuestionCard = ({ item, index }) => {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <div className='q-card'>
            <button
                className='q-card__header'
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className='q-card__index'>Q{index + 1}</span>
                <p className='q-card__question'>{item.question}</p>
                <span className={`q-card__chevron ${isOpen ? 'q-card__chevron--open' : ''}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9" />
                    </svg>
                </span>
            </button>

            {isOpen && (
                <div className='q-card__body'>
                    <div className='q-card__section'>
                        <h4 className='q-card__tag q-card__tag--intention'>Intention</h4>
                        <p>{item.intention}</p>
                    </div>
                    <div className='q-card__section'>
                        <h4 className='q-card__tag q-card__tag--answer'>Model Answer</h4>
                        <p>{item.answer}</p>
                    </div>
                </div>
            )}
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────
// Roadmap Day Component
// ─────────────────────────────────────────────────────────────────────
const RoadmapDay = ({ day }) => {
    return (
        <div className='roadmap-day'>
            <div className='roadmap-day__header'>
                <span className='roadmap-day__badge'>Day {day.day}</span>
                <h3 className='roadmap-day__focus'>{day.focus}</h3>
            </div>
            <ul className='roadmap-day__tasks'>
                {day.tasks.map((task, index) => (
                    <li key={index}>
                        <span className='roadmap-day__bullet' />
                        {task}
                    </li>
                ))}
            </ul>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────
// Main Interview Component
// ─────────────────────────────────────────────────────────────────────
const Interview = () => {
    const { interviewId } = useParams()
    const [activeSection, setActiveSection] = useState('technical')
    const [isLoading, setIsLoading] = useState(true)
    const [reportData, setReportData] = useState(null)

    useEffect(() => {
        setTimeout(() => {
            const dummyReport = {
                matchScore: 88,
                technicalQuestions: [
                    {
                        question: 'Explain the Node.js event loop and how it handles asynchronous I/O operations.',
                        intention: 'Assess understanding of Node.js concurrency model',
                        answer: 'The event loop is a single-threaded loop that processes callbacks. Async I/O is offloaded to libuv thread pool, and on completion, callbacks are pushed back to the event loop for execution.'
                    },
                    {
                        question: 'How do you optimize a MongoDB aggregation pipeline for high-volume data?',
                        intention: 'Test database performance knowledge',
                        answer: 'Use $match and $project early to reduce documents, leverage indexes on grouped fields, avoid $lookup on large collections, and use allowDiskUse for memory-heavy stages.'
                    },
                    {
                        question: 'Can you describe the Cache-Aside pattern and when you would use Redis in a Node.js application?',
                        intention: 'Evaluate caching strategy awareness',
                        answer: 'Cache-Aside means the app checks cache first; on a miss it fetches from DB and populates the cache. Redis is ideal for sessions, rate limiting, and caching expensive queries.'
                    },
                    {
                        question: 'What are the challenges of migrating a monolithic application to a modular service-based architecture?',
                        intention: 'Assess system design and architectural thinking',
                        answer: 'Key challenges include data consistency across services, network latency, distributed tracing, inter-service communication contracts, and handling partial failures gracefully.'
                    }
                ],
                behavioralQuestions: [
                    {
                        question: 'Tell me about a time you had to deal with a difficult stakeholder.',
                        intention: 'Evaluate communication and conflict resolution skills',
                        answer: 'Use the STAR method: describe the situation, your task, the actions you took to align expectations, and the positive outcome achieved.'
                    },
                    {
                        question: 'Describe a project where you had to learn a new technology quickly.',
                        intention: 'Assess adaptability and learning agility',
                        answer: 'Focus on how you identified learning resources, set milestones, and applied the technology in a real project context within a tight timeline.'
                    }
                ],
                preparationPlan: [
                    {
                        day: 1,
                        focus: 'Node.js Internals',
                        tasks: ['Deep dive into event loop phases', 'Study libuv and thread pool', 'Practice async/await patterns']
                    },
                    {
                        day: 2,
                        focus: 'MongoDB & Redis',
                        tasks: ['Aggregation pipeline optimization', 'Indexing strategies', 'Redis caching patterns']
                    },
                    {
                        day: 3,
                        focus: 'System Design',
                        tasks: ['Microservices decomposition', 'CAP theorem', 'Service communication patterns']
                    }
                ],
                skillGaps: [
                    { skill: 'Message Queues (Kafka/RabbitMQ)', severity: 'high' },
                    { skill: 'Advanced Docker & CI/CD Pipelines', severity: 'medium' },
                    { skill: 'Distributed Systems Design', severity: 'medium' },
                    { skill: 'Production-level Redis management', severity: 'low' }
                ]
            }
            setReportData(dummyReport)
            setIsLoading(false)
        }, 1200)
    }, [interviewId])

    if (isLoading) {
        return (
            <div className='interview-page'>
                <div className='loading-screen'>
                    <h1>Loading your interview plan...</h1>
                </div>
            </div>
        )
    }

    if (!reportData) {
        return (
            <div className='interview-page'>
                <div className='error-screen'>
                    <h1>No report found</h1>
                </div>
            </div>
        )
    }

    const scoreColor =
        reportData.matchScore >= 80 ? 'high' :
        reportData.matchScore >= 60 ? 'mid' : 'low'

    return (
        <div className='interview-page'>
            <div className='interview-layout'>

                {/* Left Navigation */}
                <nav className='interview-nav'>
                    <div className='interview-nav__items'>
                        <p className='interview-nav__label'>Sections</p>
                        {[
                            {
                                id: 'technical',
                                label: 'Technical Questions',
                                icon: (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="16 18 22 12 16 6" />
                                        <polyline points="8 6 2 12 8 18" />
                                    </svg>
                                )
                            },
                            {
                                id: 'behavioral',
                                label: 'Behavioral Questions',
                                icon: (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                    </svg>
                                )
                            },
                            {
                                id: 'roadmap',
                                label: 'Road Map',
                                icon: (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polygon points="3 11 22 2 13 21 11 13 3 11" />
                                    </svg>
                                )
                            }
                        ].map(item => (
                            <button
                                key={item.id}
                                className={`interview-nav__item ${activeSection === item.id ? 'interview-nav__item--active' : ''}`}
                                onClick={() => setActiveSection(item.id)}
                            >
                                <span className='interview-nav__icon'>{item.icon}</span>
                                {item.label}
                            </button>
                        ))}
                    </div>

                    <button className='interview-nav__download' onClick={() => alert('Download feature coming soon')}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        Download Resume
                    </button>
                </nav>

                <div className='interview-divider' />

                {/* Main Content */}
                <main className='interview-content'>
                    {activeSection === 'technical' && (
                        <section>
                            <div className='content-header'>
                                <h2>Technical Questions</h2>
                                <span className='content-header__count'>{reportData.technicalQuestions.length} questions</span>
                            </div>
                            <div className='q-list'>
                                {reportData.technicalQuestions.map((q, i) => (
                                    <QuestionCard key={i} item={q} index={i} />
                                ))}
                            </div>
                        </section>
                    )}

                    {activeSection === 'behavioral' && (
                        <section>
                            <div className='content-header'>
                                <h2>Behavioral Questions</h2>
                                <span className='content-header__count'>{reportData.behavioralQuestions.length} questions</span>
                            </div>
                            <div className='q-list'>
                                {reportData.behavioralQuestions.map((q, i) => (
                                    <QuestionCard key={i} item={q} index={i} />
                                ))}
                            </div>
                        </section>
                    )}

                    {activeSection === 'roadmap' && (
                        <section>
                            <div className='content-header'>
                                <h2>Preparation Roadmap</h2>
                                <span className='content-header__count'>{reportData.preparationPlan.length} days</span>
                            </div>
                            <div className='roadmap-list'>
                                {reportData.preparationPlan.map(day => (
                                    <RoadmapDay key={day.day} day={day} />
                                ))}
                            </div>
                        </section>
                    )}
                </main>

                <div className='interview-divider' />

                {/* Right Sidebar */}
                <aside className='interview-sidebar'>
                    <div className='match-score'>
                        <p className='match-score__label'>Match Score</p>
                        <div className={`match-score__ring score--${scoreColor}`}>
                            <span className='match-score__value'>{reportData.matchScore}</span>
                            <span className='match-score__pct'>%</span>
                        </div>
                        <p className='match-score__sub'>Strong match for this role</p>
                    </div>

                    <div className='sidebar-divider' />

                    <div className='skill-gaps'>
                        <p className='skill-gaps__label'>Skill Gaps</p>
                        <div className='skill-gaps__list'>
                            {reportData.skillGaps.map((gap, i) => (
                                <span key={i} className={`skill-tag skill-tag--${gap.severity}`}>
                                    {gap.skill}
                                </span>
                            ))}
                        </div>
                    </div>
                </aside>

            </div>
        </div>
    )
}

export default Interview