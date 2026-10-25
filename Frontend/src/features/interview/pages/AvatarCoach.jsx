import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import AppNavbar from '../../../components/AppNavbar'
import { Button, Card, Input, PageHeader, Select, Textarea } from '../../../components/ui'
import { listResumes, saveInterviewAchievements } from '../../resume/services/resume.api'
import { getAvatarResumeInsights, sendAvatarInterviewTurn } from '../services/interview.api'
import './avatarCoach.scss'

const SpeechUtterance = typeof window !== 'undefined'
  ? window.SpeechSynthesisUtterance || window.webkitSpeechSynthesisUtterance
  : null
const SpeechRecognitionConstructor = typeof window !== 'undefined'
  ? window.SpeechRecognition || window.webkitSpeechRecognition
  : null

const AvatarCoach = () => {
  const location = useLocation()
  const [resumes, setResumes] = useState([])
  const [resumesLoading, setResumesLoading] = useState(true)
  const [resumeLoadError, setResumeLoadError] = useState('')
  const [resumeRetry, setResumeRetry] = useState(0)
  const [selectedResumeId, setSelectedResumeId] = useState(location.state?.resumeId || '')
  const [targetRole, setTargetRole] = useState('Software Developer')
  const [interviewLanguage, setInterviewLanguage] = useState('hinglish')
  const [interviewStarted, setInterviewStarted] = useState(false)
  const [messages, setMessages] = useState([])
  const [isThinking, setIsThinking] = useState(false)
  const [speakingId, setSpeakingId] = useState(null)
  const [isListening, setIsListening] = useState(false)
  const [voiceTranscript, setVoiceTranscript] = useState('')
  const [voiceError, setVoiceError] = useState('')
  const [error, setError] = useState('')
  const [wrapUpComplete, setWrapUpComplete] = useState(false)
  const [wrapUpLoading, setWrapUpLoading] = useState(false)
  const [wrapUpError, setWrapUpError] = useState('')
  const [resumeSuggestions, setResumeSuggestions] = useState([])
  const [savingAchievements, setSavingAchievements] = useState(false)
  const [achievementSaved, setAchievementSaved] = useState(false)
  const [achievementSaveError, setAchievementSaveError] = useState('')
  const messagesEndRef = useRef(null)
  const resumeReviewRef = useRef(null)
  const messagesRef = useRef([])
  const candidateIntroRef = useRef('')
  const interviewStartedRef = useRef(false)
  const isThinkingRef = useRef(false)
  const speakingRef = useRef(false)
  const isListeningRef = useRef(false)
  const shouldListenRef = useRef(false)
  const idlePromptActiveRef = useRef(false)
  const idlePromptedForQuestionRef = useRef(false)
  const idlePromptMessageIdRef = useRef(null)
  const recognitionRef = useRef(null)
  const activeUtteranceRef = useRef(null)
  const speechQueueRef = useRef([])
  const idleTimerRef = useRef(null)
  const recognitionRetryRef = useRef(null)
  const speechSupported = typeof window !== 'undefined'
    && Boolean(window.speechSynthesis && SpeechUtterance)
  const microphoneSupported = typeof navigator !== 'undefined'
    && Boolean(navigator.mediaDevices?.getUserMedia)
  const voiceInterviewSupported = speechSupported && Boolean(SpeechRecognitionConstructor) && microphoneSupported
  const avatarMode = speakingId ? 'speaking' : isThinking ? 'thinking' : isListening ? 'listening' : 'ready'
  const selectedResume = resumes.find((resume) => resume._id === selectedResumeId)

  const updateThinking = (value) => {
    isThinkingRef.current = value
    setIsThinking(value)
  }

  const updateListening = (value) => {
    isListeningRef.current = value
    setIsListening(value)
  }

  const replaceMessages = (nextMessages) => {
    messagesRef.current = nextMessages
    setMessages(nextMessages)
  }

  const appendMessage = (message) => replaceMessages([...messagesRef.current, message])

  const updateMessageText = (id, text) => {
    const existing = messagesRef.current.some((message) => message.id === id)
    const nextMessages = existing
      ? messagesRef.current.map((message) => message.id === id ? { ...message, text } : message)
      : [...messagesRef.current, { id, role: 'assistant', text }]
    replaceMessages(nextMessages)
  }

  const removeIdlePromptMessage = () => {
    if (!idlePromptMessageIdRef.current) return
    replaceMessages(messagesRef.current.filter((message) => message.id !== idlePromptMessageIdRef.current))
    idlePromptMessageIdRef.current = null
  }

  const clearVoiceTimers = () => {
    window.clearTimeout(idleTimerRef.current)
    window.clearTimeout(recognitionRetryRef.current)
    idleTimerRef.current = null
    recognitionRetryRef.current = null
  }

  const getLanguagePrompt = (hinglish, english, hindi) => (
    interviewLanguage === 'en' ? english : interviewLanguage === 'hi' ? hindi : hinglish
  )

  const armIdlePrompt = (reset = false) => {
    if (idleTimerRef.current && !reset) return
    window.clearTimeout(idleTimerRef.current)
    if (!shouldListenRef.current || idlePromptedForQuestionRef.current) return

    idleTimerRef.current = window.setTimeout(() => {
      idleTimerRef.current = null
      if (!shouldListenRef.current || speakingRef.current || idlePromptedForQuestionRef.current) return

      idlePromptedForQuestionRef.current = true
      idlePromptActiveRef.current = true
      const reminder = {
        id: `mira-idle-${Date.now()}`,
        role: 'assistant',
        text: getLanguagePrompt(
          'Kaafi der ho gayi—kya hum is question ko skip karein?',
          "We've been on this question for a while. Should I skip it?",
          'काफी समय हो गया है—क्या हम इस सवाल को छोड़ दें?'
        ),
      }
      idlePromptMessageIdRef.current = reminder.id
      appendMessage(reminder)
      speakMessage(reminder.id, reminder.text)
    }, 18000)
  }

  const scheduleRecognitionRetry = (delay) => {
    if (recognitionRetryRef.current) return
    recognitionRetryRef.current = window.setTimeout(() => {
      recognitionRetryRef.current = null
      startListening()
    }, delay)
  }

  const startListening = () => {
    if (!SpeechRecognitionConstructor || !shouldListenRef.current || speakingRef.current || isThinkingRef.current) return

    window.clearTimeout(recognitionRetryRef.current)
    recognitionRetryRef.current = null
    setVoiceError('')
    setVoiceTranscript('')

    let recognition = recognitionRef.current
    try {
      if (!recognition) {
        recognition = new SpeechRecognitionConstructor()
        recognitionRef.current = recognition
      }
    } catch {
      shouldListenRef.current = false
      setVoiceError('This browser could not start voice recognition. Try Chrome or Edge with microphone access.')
      return
    }
    recognition.lang = interviewLanguage === 'en' ? 'en-IN' : 'hi-IN'
    recognition.continuous = false
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      updateListening(true)
      armIdlePrompt()
    }

    recognition.onresult = (event) => {
      let finalTranscript = ''
      let interimTranscript = ''
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const transcript = event.results[index][0]?.transcript || ''
        if (event.results[index].isFinal) finalTranscript += transcript
        else interimTranscript += transcript
      }

      const heard = (finalTranscript || interimTranscript).trim()
      if (heard) {
        setVoiceTranscript(heard)
        armIdlePrompt(true)
      }
      if (finalTranscript.trim()) {
        window.clearTimeout(idleTimerRef.current)
        handleRecognizedSpeech(finalTranscript.trim())
      }
    }

    recognition.onerror = (event) => {
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        shouldListenRef.current = false
        setVoiceError('Microphone access is blocked. Allow microphone access in your browser, then try again.')
      } else if (!['no-speech', 'aborted'].includes(event.error)) {
        shouldListenRef.current = false
        setVoiceError('Voice recognition paused. Try restarting the microphone.')
      }
    }

    recognition.onend = () => {
      updateListening(false)
      if (shouldListenRef.current && !speakingRef.current && !isThinkingRef.current) {
        scheduleRecognitionRetry(350)
      }
    }

    try {
      recognition.start()
    } catch {
      scheduleRecognitionRetry(500)
    }
  }

  const startSpeech = (id, text) => {
    if (!speechSupported) return

    speakingRef.current = true
    window.clearTimeout(idleTimerRef.current)
    const wasListening = isListeningRef.current
    if (recognitionRef.current && wasListening) {
      try { recognitionRef.current.stop() } catch { /* Recognition may already be stopping. */ }
    }
    updateListening(false)

    const utterance = new SpeechUtterance(text)
    const hindiScript = /[\u0900-\u097F]/.test(text)
    const romanHindi = /\b(?:aap|apka|kya|hai|hain|ho|mujhe|mera|meri|mere|maine|hum|hume|karna|karein|batao|nahi|nahin|kyun|kaise|kahan|kyunki|thoda|bahut|achha|der|skip|sawal)\b/i.test(text)
    utterance.lang = interviewLanguage === 'hi' || hindiScript || romanHindi ? 'hi-IN' : 'en-IN'
    utterance.rate = 0.96
    activeUtteranceRef.current = utterance
    utterance.onend = () => {
      if (activeUtteranceRef.current !== utterance) return
      activeUtteranceRef.current = null
      const nextMessage = speechQueueRef.current.shift()
      if (nextMessage) {
        startSpeech(nextMessage.id, nextMessage.text)
      } else {
        speakingRef.current = false
        setSpeakingId(null)
        if (shouldListenRef.current && !isThinkingRef.current) startListening()
      }
    }
    utterance.onerror = () => {
      if (activeUtteranceRef.current !== utterance) return
      activeUtteranceRef.current = null
      const nextMessage = speechQueueRef.current.shift()
      if (nextMessage) {
        startSpeech(nextMessage.id, nextMessage.text)
      } else {
        speakingRef.current = false
        setSpeakingId(null)
        if (shouldListenRef.current && !isThinkingRef.current) startListening()
      }
    }
    setSpeakingId(id)
    window.speechSynthesis.speak(utterance)
  }

  const speakMessage = (id, text) => {
    if (!speechSupported) return
    speechQueueRef.current = []
    activeUtteranceRef.current = null
    window.speechSynthesis.cancel()
    speakingRef.current = false
    startSpeech(id, text)
  }

  const queueSpeech = (id, text) => {
    if (!speechSupported || !text.trim()) return
    speechQueueRef.current.push({ id, text: text.trim() })
    if (!speakingRef.current) {
      const nextMessage = speechQueueRef.current.shift()
      if (nextMessage) startSpeech(nextMessage.id, nextMessage.text)
    }
  }

  const handleRecognizedSpeech = (spokenText) => {
    const message = spokenText.trim().slice(0, 1800)
    if (!message || !interviewStartedRef.current) return
    updateListening(false)
    setVoiceTranscript('')

    let skipConfirmed = false
    if (idlePromptActiveRef.current) {
      idlePromptActiveRef.current = false
      const normalized = message.toLowerCase().replace(/[.,!?।]/g, '').trim()
      const firstWord = normalized.split(/\s+/)[0]
      const confirmsSkip = ['yes', 'yeah', 'yep', 'okay', 'ok', 'haan', 'han', 'ha', 'haa', 'haanji', 'ji', 'bilkul', 'theek', 'thik', 'skip', 'next', 'हाँ', 'हां', 'जी', 'ठीक', 'छोड़', 'छोड़ो', 'छोड़ें'].includes(firstWord)
      const declinesSkip = ['no', 'nope', 'nahi', 'nahin', 'na', 'नहीं', 'नही'].includes(normalized)

      if (declinesSkip) {
        removeIdlePromptMessage()
        const acknowledgement = {
          id: `mira-wait-${Date.now()}`,
          role: 'assistant',
          text: getLanguagePrompt(
            'Theek hai, aap apna jawab dijiye.',
            'Okay, take your time. Please answer when you are ready.',
            'ठीक है, आप अपना जवाब बताइए।'
          ),
        }
        shouldListenRef.current = true
        speakMessage(acknowledgement.id, acknowledgement.text)
        return
      }

      if (!confirmsSkip) {
        removeIdlePromptMessage()
        idlePromptActiveRef.current = false
      } else skipConfirmed = true
    }

    sendVoiceAnswer(message, { skipConfirmation: skipConfirmed })
  }

  const startInterview = async () => {
    if (!selectedResumeId || !targetRole.trim() || isThinkingRef.current) return
    if (!voiceInterviewSupported) {
      setError('Live voice interview needs a browser with speech recognition and speech playback, such as Chrome or Edge.')
      return
    }

    clearVoiceTimers()
    speechQueueRef.current = []
    shouldListenRef.current = false
    idlePromptActiveRef.current = false
    idlePromptedForQuestionRef.current = false
    idlePromptMessageIdRef.current = null
    interviewStartedRef.current = false
    replaceMessages([])
    candidateIntroRef.current = ''
    setWrapUpComplete(false)
    setWrapUpError('')
    setResumeSuggestions([])
    setAchievementSaved(false)
    setAchievementSaveError('')
    setError('')
    setVoiceError('')
    updateThinking(true)
    try {
      const microphoneStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      microphoneStream.getTracks().forEach((track) => track.stop())
      const response = await sendAvatarInterviewTurn({
        action: 'start',
        resumeId: selectedResumeId,
        targetRole: targetRole.trim(),
        language: interviewLanguage,
        history: [],
      })
      const opening = { id: `mira-${Date.now()}`, role: 'assistant', text: response.reply }
      replaceMessages([opening])
      interviewStartedRef.current = true
      setInterviewStarted(true)
      shouldListenRef.current = true
      speakMessage(opening.id, opening.text)
    } catch (startError) {
      setError(startError.name === 'NotAllowedError'
        ? 'Microphone access is needed for a voice interview. Allow it in your browser and try again.'
        : startError.response?.data?.message || startError.message || 'Mira couldn’t review this CV. Please try again.')
    } finally {
      updateThinking(false)
    }
  }

  const sendVoiceAnswer = async (rawMessage, { skipConfirmation = false } = {}) => {
    const message = rawMessage.trim().slice(0, 1800)
    if (!message || !interviewStartedRef.current || isThinkingRef.current) return

    clearVoiceTimers()
    shouldListenRef.current = false
    if (recognitionRef.current) {
      try { recognitionRef.current.stop() } catch { /* Recognition may already be stopping. */ }
    }

    const isFirstAnswer = messagesRef.current.every((item) => item.role !== 'user')
    const intro = candidateIntroRef.current || (isFirstAnswer && !skipConfirmation ? message : '')
    if (isFirstAnswer && !skipConfirmation) candidateIntroRef.current = intro

    const userEntry = { id: `candidate-${Date.now()}`, role: 'user', text: message }
    appendMessage(userEntry)
    setError('')
    setVoiceError('')
    updateThinking(true)
    let partialReply = ''
    let speechBuffer = ''
    let hasQueuedReplySpeech = false
    const followUpId = `mira-${Date.now()}`
    const handleReplyChunk = (chunk) => {
      partialReply += chunk
      speechBuffer += chunk
      updateMessageText(followUpId, partialReply)

      // Start Mira as soon as the first complete sentence arrives, while the
      // remaining words are still streaming from the model.
      const sentenceEnd = /[?!।](?:["')\]]*)?(?=\s|$)|\.(?:["')\]]*)?(?=\s)/u
      let boundary = speechBuffer.match(sentenceEnd)
      while (boundary) {
        const end = boundary.index + boundary[0].length
        const sentence = speechBuffer.slice(0, end).trim()
        speechBuffer = speechBuffer.slice(end).trimStart()
        if (sentence) {
          hasQueuedReplySpeech = true
          queueSpeech(followUpId, sentence)
        }
        boundary = speechBuffer.match(sentenceEnd)
      }
    }

    try {
      const response = await sendAvatarInterviewTurn({
        action: 'turn',
        resumeId: selectedResumeId,
        targetRole: targetRole.trim(),
        language: interviewLanguage,
        message,
        candidateIntro: intro,
        history: messagesRef.current.map(({ role, text }) => ({ role, content: text })),
        onReplyChunk: handleReplyChunk,
      })
      const replyText = (response.reply || partialReply).trim()
      updateMessageText(followUpId, replyText)
      idlePromptActiveRef.current = false
      idlePromptedForQuestionRef.current = false
      idlePromptMessageIdRef.current = null
      shouldListenRef.current = true
      if (speechBuffer.trim()) {
        hasQueuedReplySpeech = true
        queueSpeech(followUpId, speechBuffer.trim())
      } else if (!hasQueuedReplySpeech && replyText) {
        queueSpeech(followUpId, replyText)
      }
    } catch (turnError) {
      setError(turnError.response?.data?.message || turnError.message || 'Mira couldn’t continue the interview. Please try again.')
      speechQueueRef.current = []
      activeUtteranceRef.current = null
      window.speechSynthesis.cancel()
      speakingRef.current = false
      setSpeakingId(null)
      replaceMessages(messagesRef.current.filter((item) => item.id !== userEntry.id && item.id !== followUpId && item.id !== idlePromptMessageIdRef.current))
      idlePromptMessageIdRef.current = null
      idlePromptActiveRef.current = false
      if (isFirstAnswer) candidateIntroRef.current = ''
      const retryPrompt = {
        id: `mira-retry-${Date.now()}`,
        role: 'assistant',
        text: getLanguagePrompt(
          'Mujhe jawab process karne mein dikkat hui. Please apna jawab ek baar phir boliye.',
          'I had trouble processing that. Please say your answer once more.',
          'मुझे जवाब समझने में परेशानी हुई। कृपया अपना जवाब फिर से बताइए।'
        ),
      }
      appendMessage(retryPrompt)
      shouldListenRef.current = true
      speakMessage(retryPrompt.id, retryPrompt.text)
    } finally {
      updateThinking(false)
      if (shouldListenRef.current && !speakingRef.current && !speechQueueRef.current.length) startListening()
    }
  }

  const stopInterviewAudio = () => {
    clearVoiceTimers()
    speechQueueRef.current = []
    shouldListenRef.current = false
    interviewStartedRef.current = false
    speakingRef.current = false
    idlePromptActiveRef.current = false
    idlePromptedForQuestionRef.current = false
    idlePromptMessageIdRef.current = null
    activeUtteranceRef.current = null
    if (recognitionRef.current) {
      try { recognitionRef.current.abort() } catch { /* Recognition may already be stopped. */ }
    }
    if (speechSupported) window.speechSynthesis.cancel()
    updateListening(false)
    setSpeakingId(null)
    setVoiceTranscript('')
    setVoiceError('')
  }

  const endInterview = async () => {
    const conversation = messagesRef.current.map(({ role, text }) => ({ role, content: text }))
    stopInterviewAudio()
    interviewStartedRef.current = false
    setInterviewStarted(false)
    setWrapUpComplete(true)
    setWrapUpError('')
    setAchievementSaved(false)
    setAchievementSaveError('')

    if (!conversation.some((item) => item.role === 'user')) {
      setResumeSuggestions([])
      return
    }

    setWrapUpLoading(true)
    try {
      const response = await getAvatarResumeInsights({
        resumeId: selectedResumeId,
        targetRole: targetRole.trim(),
        conversation,
      })
      setResumeSuggestions((response.suggestions || []).map((item) => ({ ...item, accepted: false })))
    } catch (insightsError) {
      setWrapUpError(insightsError.response?.data?.message || insightsError.message || 'Mira couldn’t prepare resume additions. Please try again.')
    } finally {
      setWrapUpLoading(false)
    }
  }

  const retryResumeInsights = async () => {
    const conversation = messagesRef.current.map(({ role, text }) => ({ role, content: text }))
    setWrapUpLoading(true)
    setWrapUpError('')
    try {
      const response = await getAvatarResumeInsights({ resumeId: selectedResumeId, targetRole: targetRole.trim(), conversation })
      setResumeSuggestions((response.suggestions || []).map((item) => ({ ...item, accepted: false })))
    } catch (insightsError) {
      setWrapUpError(insightsError.response?.data?.message || insightsError.message || 'Mira couldn’t prepare resume additions. Please try again.')
    } finally {
      setWrapUpLoading(false)
    }
  }

  const startAnotherInterview = () => {
    setWrapUpComplete(false)
    setWrapUpError('')
    setResumeSuggestions([])
    setAchievementSaved(false)
    setAchievementSaveError('')
    replaceMessages([])
    candidateIntroRef.current = ''
    setError('')
  }

  const updateResumeSuggestion = (index, key, value) => {
    setResumeSuggestions((current) => current.map((item, itemIndex) => (
      itemIndex === index ? { ...item, [key]: value } : item
    )))
  }

  const confirmResumeAchievements = async () => {
    const selectedAchievements = resumeSuggestions
      .filter((item) => item.accepted && item.text.trim())
      .map(({ text, sourceAnswer }) => ({ text: text.trim(), sourceAnswer }))
    if (!selectedAchievements.length) return

    setSavingAchievements(true)
    setAchievementSaveError('')
    try {
      const response = await saveInterviewAchievements(selectedResumeId, selectedAchievements)
      setResumes((current) => current.map((resume) => resume._id === selectedResumeId
        ? { ...resume, confirmedInterviewAchievements: response.achievements || [] }
        : resume))
      setAchievementSaved(true)
    } catch (saveError) {
      setAchievementSaveError(saveError.response?.data?.message || saveError.message || 'Could not save your resume additions.')
    } finally {
      setSavingAchievements(false)
    }
  }

  const resumeMicrophone = () => {
    if (!interviewStartedRef.current) return
    setVoiceError('')
    shouldListenRef.current = true
    if (speakingRef.current) {
      speechQueueRef.current = []
      activeUtteranceRef.current = null
      window.speechSynthesis.cancel()
      speakingRef.current = false
      setSpeakingId(null)
    }
    startListening()
  }

  useEffect(() => {
    let cancelled = false
    const loadResumes = async () => {
      setResumesLoading(true)
      setResumeLoadError('')
      try {
        const response = await listResumes()
        if (cancelled) return
        const savedResumes = response.resumes || []
        setResumes(savedResumes)
        setSelectedResumeId((current) => savedResumes.some((resume) => resume._id === current)
          ? current
          : savedResumes[0]?._id || '')
      } catch (loadError) {
        if (!cancelled) setResumeLoadError(loadError.response?.data?.message || 'We couldn’t load your saved CVs.')
      } finally {
        if (!cancelled) setResumesLoading(false)
      }
    }

    loadResumes()
    return () => { cancelled = true }
  }, [resumeRetry])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages.length, isThinking])

  useEffect(() => {
    if (wrapUpComplete && !wrapUpLoading) {
      resumeReviewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [wrapUpComplete, wrapUpLoading, resumeSuggestions.length, wrapUpError])

  useEffect(() => () => {
    shouldListenRef.current = false
    speechQueueRef.current = []
    window.clearTimeout(idleTimerRef.current)
    window.clearTimeout(recognitionRetryRef.current)
    if (recognitionRef.current) {
      try { recognitionRef.current.abort() } catch { /* Recognition may already be stopped. */ }
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
  }, [])

  return (
    <div className="page-shell ai-coach-page-shell">
      <AppNavbar />
      <main className="container ai-coach-page">
        <PageHeader
          title="AI Avatar Interview"
          subtitle="Mira speaks, listens to your answers, and asks natural follow-up questions about your CV. Hinglish is available."
          action={<Link to="/" className="ai-coach-back-link">Interview plans <span aria-hidden="true">→</span></Link>}
        />

        <div className="ai-coach-layout">
          <Card className="ai-coach-profile-card">
            <div className={`ai-coach-avatar ai-coach-avatar--${avatarMode}`} role="img" aria-label={`Mira avatar is ${avatarMode}`}>
              <div className="ai-coach-avatar__halo ai-coach-avatar__halo--outer" />
              <div className="ai-coach-avatar__halo ai-coach-avatar__halo--inner" />
              <svg className="ai-coach-avatar__portrait" viewBox="0 0 240 240" aria-hidden="true">
                <defs>
                  <linearGradient id="mira-bg" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="var(--color-accent)" />
                    <stop offset="1" stopColor="var(--color-accent-secondary)" />
                  </linearGradient>
                  <linearGradient id="mira-top" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#A896FF" />
                    <stop offset="1" stopColor="#6C5CE7" />
                  </linearGradient>
                </defs>
                <circle cx="120" cy="120" r="108" fill="url(#mira-bg)" opacity=".16" />
                <circle cx="120" cy="120" r="90" fill="var(--color-surface)" />
                <path d="M47 211c8-42 34-63 73-63s65 21 73 63" fill="url(#mira-top)" />
                <path d="M82 145c8 10 20 16 38 16s30-6 38-16l-4-20H86z" fill="#E6A889" />
                <ellipse cx="120" cy="105" rx="47" ry="57" fill="#F1C2A5" />
                <path d="M73 103c-4-39 17-66 50-66 36 0 51 24 46 68-7-8-12-20-14-30-18 12-44 17-77 14-1 5-3 10-5 14z" fill="#302747" />
                <path d="M78 111c2 27 16 51 42 51 26 0 40-23 42-51" fill="none" stroke="#302747" strokeWidth="5" strokeLinecap="round" opacity=".22" />
                <ellipse cx="103" cy="108" rx="3.2" ry="4.2" fill="#302747" />
                <ellipse cx="137" cy="108" rx="3.2" ry="4.2" fill="#302747" />
                <path d="M106 130c8 6 20 6 28 0" fill="none" stroke="#A84F69" strokeWidth="3" strokeLinecap="round" className="ai-coach-avatar__smile" />
                <ellipse cx="120" cy="130" rx="8" ry="4" fill="#A84F69" className="ai-coach-avatar__open-mouth" />
                <circle cx="84" cy="122" r="6" fill="#E99598" opacity=".3" />
                <circle cx="156" cy="122" r="6" fill="#E99598" opacity=".3" />
              </svg>
              <span className="ai-coach-avatar__spark ai-coach-avatar__spark--one" aria-hidden="true">✦</span>
              <span className="ai-coach-avatar__spark ai-coach-avatar__spark--two" aria-hidden="true">✧</span>
            </div>

            <div className="ai-coach-profile-copy">
              <span className="ai-coach-eyebrow">SKILLMIRROR AI</span>
              <h2>Mira</h2>
              <p>Your CV-aware interviewer. She asks one question at a time and follows up on your answers.</p>
            </div>

            <div className={`ai-coach-status ai-coach-status--${avatarMode}`} aria-live="polite">
              <span aria-hidden="true" />
              {avatarMode === 'thinking'
                ? interviewStarted ? 'Choosing a follow-up question' : 'Reviewing your CV'
                  : avatarMode === 'speaking' ? 'Mira is speaking'
                  : avatarMode === 'listening' ? 'Listening to your answer'
                    : interviewStarted ? 'Waiting for your answer' : wrapUpComplete ? 'Interview recap ready' : 'Ready to interview'}
            </div>

            {!interviewStarted && !wrapUpComplete ? (
              <div className="ai-coach-setup">
                {resumesLoading && <div className="ai-coach-load-status" role="status"><span className="ai-coach-inline-spinner" /> Loading saved CVs…</div>}
                {resumeLoadError && (
                  <div className="ai-coach-load-error" role="alert">
                    <span>{resumeLoadError}</span>
                    <Button type="button" variant="secondary" size="sm" onClick={() => setResumeRetry((key) => key + 1)}>Try again</Button>
                  </div>
                )}
                {!resumesLoading && !resumeLoadError && resumes.length === 0 && (
                  <div className="ai-coach-no-resume">
                    <strong>Upload a CV to begin</strong>
                    <span>Mira needs a saved CV to ask about your actual projects and experience.</span>
                    <Link to="/resumes">Go to My Resumes <span aria-hidden="true">→</span></Link>
                  </div>
                )}
                {resumes.length > 0 && (
                  <>
                    <Select label="Choose your CV" value={selectedResumeId} disabled={resumesLoading || isThinking} onChange={(event) => setSelectedResumeId(event.target.value)}>
                      <option value="">Select a saved CV</option>
                      {resumes.map((resume) => <option key={resume._id} value={resume._id}>{resume.fileName}</option>)}
                    </Select>
                    <Input
                      label="Interview role"
                      value={targetRole}
                      maxLength={100}
                      onChange={(event) => setTargetRole(event.target.value)}
                      placeholder="e.g. Frontend Developer"
                      disabled={isThinking}
                    />
                    <Select label="Interview language" value={interviewLanguage} disabled={isThinking} onChange={(event) => setInterviewLanguage(event.target.value)}>
                      <option value="hinglish">Hinglish (recommended)</option>
                      <option value="en">English</option>
                      <option value="hi">Hindi</option>
                    </Select>
                    {!voiceInterviewSupported && (
                      <div className="ai-coach-voice-support" role="status">
                        Live voice interview needs speech recognition and audio playback. Open this page in Chrome or Edge and allow microphone access.
                      </div>
                    )}
                    <Button type="button" variant="primary" onClick={startInterview} disabled={!selectedResumeId || !targetRole.trim() || isThinking || !voiceInterviewSupported}>
                      {isThinking ? 'Reviewing your CV…' : 'Start AI interview'}
                      {isThinking && <span className="ai-coach-inline-spinner ai-coach-inline-spinner--button" aria-hidden="true" />}
                    </Button>
                    <ol className="ai-coach-interview-steps">
                      <li>Mira asks what to call you.</li>
                      <li>She picks a real detail from your CV.</li>
                      <li>Speak naturally; Mira listens after each question.</li>
                    </ol>
                  </>
                )}
              </div>
            ) : (
              <div className="ai-coach-session-info">
                <div><span>CV</span><strong title={selectedResume?.fileName}>{selectedResume?.fileName || 'Selected CV'}</strong></div>
                <div><span>ROLE</span><strong>{targetRole}</strong></div>
                <div><span>LANGUAGE</span><strong>{interviewLanguage === 'hinglish' ? 'Hinglish' : interviewLanguage === 'hi' ? 'Hindi' : 'English'}</strong></div>
                {wrapUpComplete ? (
                  <Button type="button" variant="secondary" size="sm" onClick={startAnotherInterview} disabled={wrapUpLoading}>Start another interview</Button>
                ) : (
                  <Button type="button" variant="secondary" size="sm" onClick={endInterview} disabled={isThinking || wrapUpLoading}>End & review resume</Button>
                )}
              </div>
            )}

            <div className="ai-coach-separation-note">
              <span aria-hidden="true">✦</span>
              <p>Speak your answers; Mira listens after each question. Voice Mock Interview remains a separate feature.</p>
            </div>
          </Card>

          <Card className="ai-coach-chat-card">
            <div className="ai-coach-chat-heading">
              <div><span>{wrapUpComplete ? 'INTERVIEW TO RESUME' : 'LIVE INTERVIEW'}</span><h2>{interviewStarted ? 'Your conversation with Mira' : wrapUpComplete ? 'Your interview recap' : 'Your interview room'}</h2></div>
              <span className="ai-coach-chat-heading__mode"><span aria-hidden="true" /> {interviewStarted ? 'In progress' : wrapUpComplete ? 'Review additions' : 'CV-based'}</span>
            </div>

            <div className="ai-coach-messages" role="log" aria-live="polite" aria-relevant="additions text">
              {messages.map((message) => (
                <article className={`ai-coach-message ai-coach-message--${message.role}`} key={message.id}>
                  {message.role === 'assistant' && <span className="ai-coach-message__avatar" aria-hidden="true">M</span>}
                  <div className="ai-coach-message__bubble">
                    <span className="ai-coach-message__sender">{message.role === 'assistant' ? 'Mira · Interviewer' : 'You'}</span>
                    <p>{message.text}</p>
                  </div>
                </article>
              ))}

              {isThinking && (
                <article className="ai-coach-message ai-coach-message--assistant" role="status">
                  <span className="ai-coach-message__avatar" aria-hidden="true">M</span>
                  <div className="ai-coach-message__bubble ai-coach-message__bubble--thinking">
                    <span className="ai-coach-message__sender">Mira · Interviewer</span>
                    <span className="ai-coach-thinking-dots" aria-label="Mira is thinking"><i /><i /><i /></span>
                  </div>
                </article>
              )}

              {!interviewStarted && !wrapUpComplete && !isThinking && (
                <div className="ai-coach-empty-room">
                  <span aria-hidden="true">✦</span>
                  <strong>Choose your CV and role to begin</strong>
                  <p>Mira will open by asking your name, then use details from the selected CV to guide the interview.</p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {error && <p className="ai-coach-error" role="alert">{error}</p>}

            {wrapUpComplete ? (
              <section className="ai-coach-resume-review" aria-live="polite" ref={resumeReviewRef}>
                {wrapUpLoading ? (
                  <div className="ai-coach-wrapup-loading" role="status">
                    <span className="ai-coach-inline-spinner" aria-hidden="true" />
                    <div><strong>Mira is reviewing your answers</strong><p>Finding details you shared that could strengthen this CV.</p></div>
                  </div>
                ) : wrapUpError ? (
                  <div className="ai-coach-resume-review__empty" role="alert">
                    <strong>Resume review didn’t finish</strong>
                    <p>{wrapUpError}</p>
                    <Button type="button" variant="secondary" size="sm" onClick={retryResumeInsights}>Try again</Button>
                  </div>
                ) : resumeSuggestions.length ? (
                  <>
                    <div className="ai-coach-resume-review__heading">
                      <div><span>MIRA FOUND SOME DRAFT IDEAS</span><h3>Review before saving</h3></div>
                      <span>{resumeSuggestions.length} {resumeSuggestions.length === 1 ? 'draft' : 'drafts'}</span>
                    </div>
                    <p className="ai-coach-resume-review__note">Edit each line and tick only details you can stand behind. These are based on your answers and aren’t independently verified. Your uploaded PDF stays unchanged; approved additions are used in future Mira interviews and ATS checks.</p>
                    <div className="ai-coach-resume-suggestions">
                      {resumeSuggestions.map((item, index) => (
                        <article className="ai-coach-resume-suggestion" key={`${index}-${item.sourceAnswer}`}>
                          <label className="ai-coach-resume-suggestion__confirm">
                            <input type="checkbox" checked={item.accepted} onChange={(event) => updateResumeSuggestion(index, 'accepted', event.target.checked)} />
                            <span>Yes, this is accurate</span>
                          </label>
                          <Textarea
                            label={`Resume bullet ${index + 1}`}
                            value={item.text}
                            maxLength={500}
                            rows={3}
                            onChange={(event) => updateResumeSuggestion(index, 'text', event.target.value)}
                          />
                          <details><summary>What you told Mira</summary><p>{item.sourceAnswer}</p></details>
                        </article>
                      ))}
                    </div>
                    {achievementSaveError && <p className="ai-coach-error" role="alert">{achievementSaveError}</p>}
                    {achievementSaved && <p className="ai-coach-save-success" role="status">Saved. Future ATS checks and Mira interviews will include your approved additions.</p>}
                    <div className="ai-coach-resume-review__actions">
                      <Button type="button" variant="primary" onClick={confirmResumeAchievements} disabled={savingAchievements || !resumeSuggestions.some((item) => item.accepted && item.text.trim())}>
                        {savingAchievements ? 'Saving additions…' : 'Save selected additions'}
                        {savingAchievements && <span className="ai-coach-inline-spinner ai-coach-inline-spinner--button" aria-hidden="true" />}
                      </Button>
                      <Button type="button" variant="secondary" onClick={startAnotherInterview} disabled={savingAchievements}>Done</Button>
                    </div>
                  </>
                ) : (
                  <div className="ai-coach-resume-review__empty">
                    <strong>No new resume bullets this time</strong>
                    <p>Mira didn’t find a clear, new detail in your answers to add. You can still use this interview to practise your responses.</p>
                    <Button type="button" variant="secondary" size="sm" onClick={startAnotherInterview}>Start another interview</Button>
                  </div>
                )}
              </section>
            ) : interviewStarted ? (
              <div className={`ai-coach-voice-console${isListening ? ' ai-coach-voice-console--listening' : ''}`} role="status" aria-live="polite">
                <span className="ai-coach-voice-console__mic" aria-hidden="true">{isListening ? '●' : '◉'}</span>
                <div className="ai-coach-voice-console__copy">
                  <strong>{isThinking ? 'Mira is thinking…' : speakingId ? 'Mira is speaking…' : isListening ? 'Listening — speak naturally' : 'Mira will listen after speaking'}</strong>
                  <p role={voiceError ? 'alert' : undefined}>{voiceError || (voiceTranscript ? `Heard: ${voiceTranscript}` : isListening ? 'Your spoken answer will appear here as a transcript.' : 'Your microphone starts automatically after Mira finishes her question.')}</p>
                </div>
                {voiceError && <Button type="button" variant="secondary" size="sm" onClick={resumeMicrophone}>Try microphone again</Button>}
              </div>
            ) : (
              <div className="ai-coach-voice-locked">
                <span>{voiceInterviewSupported ? 'Choose a CV and start the interview. Allow microphone access when your browser asks.' : 'Use Chrome or Edge with microphone access for the live voice interview.'}</span>
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  )
}

export default AvatarCoach
