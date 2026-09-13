import React, { useState, useRef, useCallback, useEffect } from 'react'
import { useInterview } from '../hooks/useInterview.js'
import { getVoiceFeedback } from '../services/interview.api'
import AppNavbar from '../../../components/AppNavbar'
import { Button } from '../../../components/ui'
import '../style/voice.scss'

const FILLER_WORDS = /\b(um|uh|like|you know|so|basically|actually|right)\b/gi

function countFillersLocal(text) {
  return (text.match(FILLER_WORDS) || []).length
}

const SpeechRecognition = typeof window !== 'undefined'
  ? window.SpeechRecognition || window.webkitSpeechRecognition
  : null

const VoiceInterview = () => {
  const { report, loading } = useInterview()

  const [activeQ, setActiveQ] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [liveTranscript, setLiveTranscript] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [feedbackLoading, setFeedbackLoading] = useState(false)
  const [error, setError] = useState('')
  const [history, setHistory] = useState([])
  const [muted, setMuted] = useState(false)

  const recognitionRef = useRef(null)
  const utteranceRef = useRef(null)

  const speechSupported = typeof window !== 'undefined' && typeof window.speechSynthesis !== 'undefined'

  const allQuestions = [
    ...(report?.technicalQuestions || []),
    ...(report?.behaviouralQuestions || []),
  ]

  const currentQuestion = allQuestions[activeQ]

  const ttsLang = report?.language === 'hi' || report?.language === 'hinglish' ? 'hi-IN' : 'en-US'

  const speakQuestion = useCallback((question) => {
    if (!speechSupported || !question) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(question)
    utterance.lang = ttsLang
    utterance.rate = 1
    utteranceRef.current = utterance
    window.speechSynthesis.speak(utterance)
  }, [ttsLang, speechSupported])

  const cancelSpeech = useCallback(() => {
    if (speechSupported) {
      window.speechSynthesis.cancel()
    }
  }, [speechSupported])

  // Read each question aloud when it appears (unless muted or unsupported).
  useEffect(() => {
    if (muted || !currentQuestion?.question) return
    speakQuestion(currentQuestion.question)
    return cancelSpeech
  }, [activeQ, muted, currentQuestion, speakQuestion, cancelSpeech])

  const startRecording = useCallback(() => {
    if (!SpeechRecognition) {
      setError('Speech Recognition is not supported in this browser. Please use Chrome or Edge.')
      return
    }

    setError('')
    setTranscript('')
    setLiveTranscript('')
    setFeedback(null)

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = report?.language === 'hi' ? 'hi-IN' : report?.language === 'hinglish' ? 'hi-IN' : 'en-US'

    recognition.onresult = (event) => {
      let final = ''
      let interim = ''
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript + ' '
        } else {
          interim += event.results[i][0].transcript
        }
      }
      setTranscript(final.trim())
      setLiveTranscript(interim)
    }

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error)
      if (event.error === 'not-allowed') {
        setError('Microphone access denied. Please allow microphone permissions and try again.')
      } else if (event.error === 'no-speech') {
        setError('No speech detected. Please try speaking again.')
      } else {
        setError(`Speech recognition error: ${event.error}`)
      }
      setIsRecording(false)
    }

    recognition.onend = () => {
      setIsRecording(false)
    }

    recognitionRef.current = recognition
    recognition.start()
    setIsRecording(true)
  }, [report?.language])

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    setIsRecording(false)
  }, [])

  const submitAnswer = useCallback(async () => {
    if (!transcript.trim()) {
      setError('No speech captured. Please record your answer first.')
      return
    }

    setFeedbackLoading(true)
    setError('')
    try {
      const response = await getVoiceFeedback({
        questionText: currentQuestion.question,
        transcript: transcript.trim(),
      })
      const fb = response.feedback
      setFeedback(fb)

      setHistory(prev => [...prev, {
        question: currentQuestion.question,
        transcript: transcript.trim(),
        feedback: fb,
      }])
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to get feedback')
    } finally {
      setFeedbackLoading(false)
    }
  }, [transcript, currentQuestion])

  const goNext = useCallback(() => {
    if (activeQ < allQuestions.length - 1) {
      setActiveQ(prev => prev + 1)
      setTranscript('')
      setLiveTranscript('')
      setFeedback(null)
      setError('')
    }
  }, [activeQ, allQuestions.length])

  const goPrev = useCallback(() => {
    if (activeQ > 0) {
      setActiveQ(prev => prev - 1)
      const prevEntry = history[activeQ - 1]
      if (prevEntry) {
        setTranscript(prevEntry.transcript)
        setFeedback(prevEntry.feedback)
      }
      setError('')
    }
  }, [activeQ, history])

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      cancelSpeech()
    }
  }, [cancelSpeech])

  if (loading || !report) {
    return (
      <main className='loading-screen'>
        <h1>Loading interview questions...</h1>
      </main>
    )
  }

  if (!SpeechRecognition) {
    return (
      <div className='voice-page-wrap'>
        <AppNavbar />
        <div className='voice-unsupported'>
          <h2>Voice Interview Not Available</h2>
          <p>Speech Recognition is only supported in Chromium-based browsers (Chrome, Edge, Brave).</p>
          <p>Please open this page in <strong>Google Chrome</strong> or <strong>Microsoft Edge</strong> to use the voice interview feature.</p>
        </div>
      </div>
    )
  }

  return (
    <div className='voice-page-wrap'>
      <AppNavbar />
      <div className='voice-page'>
        <header className='voice-header'>
          <h1>Voice Mock Interview</h1>
          <p>Question {activeQ + 1} of {allQuestions.length}</p>
          <div className='voice-progress'>
            <div className='voice-progress__bar' style={{ width: `${((activeQ + 1) / allQuestions.length) * 100}%` }} />
          </div>
        </header>

        <div className='voice-layout'>
          {/* Question Panel */}
          <div className='voice-question-panel'>
            <div className='voice-question-card'>
              <div className='voice-question-meta'>
                <span className={`voice-difficulty voice-difficulty--${(currentQuestion.difficulty || 'Medium').toLowerCase()}`}>
                  {currentQuestion.difficulty || 'Medium'}
                </span>
                <span className='voice-q-number'>Q{activeQ + 1}</span>
                <div className='voice-tts'>
                  <button
                    type='button'
                    className='voice-tts-btn'
                    onClick={() => speakQuestion(currentQuestion.question)}
                    disabled={!speechSupported}
                    title='Replay question'
                  >
                    🔊 Replay question
                  </button>
                  <button
                    type='button'
                    className={`voice-tts-toggle ${muted ? 'voice-tts-toggle--muted' : ''}`}
                    onClick={() => setMuted(m => !m)}
                    disabled={!speechSupported}
                    title={muted ? 'Turn auto-read on' : 'Turn auto-read off'}
                  >
                    {muted ? '🔇 Muted' : '🔊 Auto-read'}
                  </button>
                </div>
              </div>
              <h2 className='voice-question-text'>{currentQuestion.question}</h2>
              {currentQuestion.intention && (
                <p className='voice-question-intention'>
                  <strong>Why this question:</strong> {currentQuestion.intention}
                </p>
              )}
            </div>

            {/* Recording Controls */}
            <div className='voice-controls'>
              {!isRecording ? (
                <Button onClick={startRecording} variant='primary' size='lg' className='voice-record-btn'>
                  <svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
                    <rect x='9' y='2' width='6' height='12' rx='3' />
                    <path d='M5 11a7 7 0 0 0 14 0' />
                    <line x1='12' y1='18' x2='12' y2='22' />
                    <line x1='8' y1='22' x2='16' y2='22' />
                  </svg>
                  Start Recording
                </Button>
              ) : (
                <Button onClick={stopRecording} variant='danger' size='lg' className='voice-stop-btn'>
                  <span className='voice-stop-btn__square' />
                  Stop Recording
                </Button>
              )}

              {isRecording && (
                <div className='voice-recording-indicator'>
                  <span className='voice-recording-indicator__pulse' />
                  Recording...
                </div>
              )}
            </div>

            {/* Live Transcript */}
            {(transcript || liveTranscript || isRecording) && (
              <div className='voice-transcript'>
                <h3>Your Answer</h3>
                <div className='voice-transcript__text'>
                  {transcript}
                  {liveTranscript && <span className='voice-transcript__interim'>{liveTranscript}</span>}
                </div>
                {transcript && (
                  <div className='voice-transcript__stats'>
                    <span>{transcript.split(/\s+/).filter(Boolean).length} words</span>
                    <span>{countFillersLocal(transcript)} filler words detected</span>
                  </div>
                )}
              </div>
            )}

            {/* Submit / Nav */}
            <div className='voice-actions'>
              <Button
                onClick={goPrev}
                disabled={activeQ === 0}
                variant='secondary'
              >
                Previous
              </Button>
              <Button
                onClick={submitAnswer}
                disabled={!transcript.trim() || feedbackLoading}
                variant='primary'
              >
                {feedbackLoading ? 'Analyzing...' : 'Get Feedback'}
              </Button>
              <Button
                onClick={goNext}
                disabled={activeQ >= allQuestions.length - 1}
                variant='secondary'
              >
                Next Question
              </Button>
            </div>

            {error && <div className='voice-error'>{error}</div>}
          </div>

          {/* Feedback Panel */}
          <div className='voice-feedback-panel'>
            {feedback ? (
              <div className='voice-feedback'>
                <h3>Feedback</h3>

                <div className='voice-score-grid'>
                  <div className='voice-score-card'>
                    <span className='voice-score-card__label'>Clarity</span>
                    <span className='voice-score-card__value'>{feedback.clarity}%</span>
                  </div>
                  <div className='voice-score-card'>
                    <span className='voice-score-card__label'>Structure</span>
                    <span className='voice-score-card__value'>{feedback.structure}%</span>
                  </div>
                  <div className='voice-score-card'>
                    <span className='voice-score-card__label'>Filler Words</span>
                    <span className={`voice-score-card__value ${feedback.fillerWordCount > 5 ? 'voice-score-card__value--bad' : ''}`}>
                      {feedback.fillerWordCount}
                    </span>
                  </div>
                </div>

                <div className='voice-tips'>
                  <h4>Improvement Tips</h4>
                  <ul>
                    {feedback.tips.map((tip, i) => (
                      <li key={i}>{tip}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className='voice-feedback-empty'>
                <p>Record your answer and click "Get Feedback" to see AI-powered analysis of your response.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default VoiceInterview
