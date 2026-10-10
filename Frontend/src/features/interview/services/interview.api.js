import axios from "axios"

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
  withCredentials: true,
})

export const generateInterviewReport = async ({
  jobDescription,
  selfDescription,
  resumeFile,
  resumeId,
  targetCompany,
  interviewDate,
  language,
  githubUsername,
  leetcodeUsername,
  codeforcesHandle,
}) => {
  if (resumeId) {
    const response = await api.post('/api/interview/', {
      jobDescription,
      selfDescription: selfDescription || '',
      resumeId,
      targetCompany,
      interviewDate,
      language,
      githubUsername: githubUsername || '',
      leetcodeUsername: leetcodeUsername || '',
      codeforcesHandle: codeforcesHandle || '',
    })
    return response.data
  }

  const formData = new FormData()
  formData.append("jobDescription", jobDescription)
  formData.append("selfDescription", selfDescription || "")
  formData.append("language", language || "en")
  if (targetCompany) {
    formData.append("targetCompany", targetCompany)
  }
  if (interviewDate) {
    formData.append("interviewDate", interviewDate)
  }
  if (githubUsername) {
    formData.append("githubUsername", githubUsername)
  }
  if (leetcodeUsername) {
    formData.append("leetcodeUsername", leetcodeUsername)
  }
  if (codeforcesHandle) {
    formData.append("codeforcesHandle", codeforcesHandle)
  }

  if (resumeFile) {
    formData.append("resume", resumeFile)
  }

  const response = await api.post("/api/interview/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  })
  return response.data
}

// ── Developer profile previews (GitHub / LeetCode / Codeforces) ──────────────
export const getGitHubSummary = async (username) => {
  const response = await api.get(`/api/github/${encodeURIComponent(username)}`)
  return response.data
}

export const getLeetCodeSummary = async (username) => {
  const response = await api.get(`/api/leetcode/${encodeURIComponent(username)}`)
  return response.data
}

export const getCodeforcesSummary = async (handle) => {
  const response = await api.get(`/api/codeforces/${encodeURIComponent(handle)}`)
  return response.data
}

export const getAtsScore = async ({ resumeText, jobDescription, targetCompany }) => {
  const response = await api.post('/api/interview/ats-score', {
    resumeText,
    jobDescription,
    targetCompany,
  })
  return response.data
}

export const getStarCheck = async ({ questionText, userAnswer }) => {
  const response = await api.post('/api/interview/star-check', {
    questionText,
    userAnswer,
  })
  return response.data
}

export const checkProofClaim = async (interviewId, claimId, { answer, evidenceNote, evidenceUrl }) => {
  const response = await api.post(
    `/api/interview/report/${interviewId}/proof-claims/${claimId}/check`,
    { answer, evidenceNote, evidenceUrl }
  )
  return response.data
}

export const getInterviewReportById = async (interviewId) => {
  const response = await api.get(`/api/interview/report/${interviewId}`)
  return response.data
}

export const getAllInterviewReports = async () => {
  const response = await api.get("/api/interview/")
  return response.data
}

export const getInterviewStats = async () => {
  const response = await api.get('/api/interview/stats')
  return response.data
}

export const generateResumePdf = async ({ interviewReportId, type = "resume" }) => {
  const response = await api.get(
    `/api/interview/report/${interviewReportId}/pdf`,
    {
      params: { type },
      responseType: "blob",
    }
  )
  return response.data
}

// ── Feature 1: Voice Feedback ─────────────────────────────────────────────────
export const getVoiceFeedback = async ({ questionText, transcript }) => {
  const response = await api.post('/api/interview/voice-feedback', {
    questionText,
    transcript,
  })
  return response.data
}

export const sendAvatarInterviewTurn = async ({ action, resumeId, targetRole, language, message, candidateIntro, history, onReplyChunk }) => {
  const body = {
    action,
    resumeId,
    targetRole,
    language,
    message,
    candidateIntro,
    history,
  }

  if (typeof onReplyChunk === 'function' && action === 'turn') {
    const baseURL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '')
    const response = await fetch(`${baseURL}/api/interview/avatar-interview`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, stream: true }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const requestError = new Error(errorData.message || 'Mira couldn’t continue the interview. Please try again.')
      requestError.response = { data: errorData }
      throw requestError
    }
    if (!response.body) throw new Error('This browser could not receive Mira’s live reply.')

    if (response.headers.get('content-type')?.includes('application/json')) {
      const data = await response.json()
      if (data.reply) onReplyChunk(data.reply)
      return data
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let reply = ''

    const handleFrame = (frame) => {
      const dataLine = frame.split(/\r?\n/).find((line) => line.startsWith('data:'))
      if (!dataLine) return
      const event = JSON.parse(dataLine.slice(5).trim())
      if (event.type === 'delta' && event.text) {
        reply += event.text
        onReplyChunk(event.text)
      } else if (event.type === 'done') {
        reply = event.reply || reply
      } else if (event.type === 'error') {
        const streamError = new Error(event.message || 'Mira couldn’t continue the interview. Please try again.')
        streamError.response = { data: { message: streamError.message } }
        throw streamError
      }
    }

    while (true) {
      const { value, done } = await reader.read()
      buffer += decoder.decode(value, { stream: !done })
      let boundary = buffer.indexOf('\n\n')
      while (boundary !== -1) {
        handleFrame(buffer.slice(0, boundary))
        buffer = buffer.slice(boundary + 2)
        boundary = buffer.indexOf('\n\n')
      }
      if (done) break
    }

    if (buffer.trim()) handleFrame(buffer)
    return { reply }
  }

  const response = await api.post('/api/interview/avatar-interview', body)
  return response.data
}

// ── Feature 2: Gap Analysis ───────────────────────────────────────────────────
export const getGapAnalysis = async ({ resumeId, resumeText, jobDescription }) => {
  const response = await api.post('/api/interview/gap-analysis', {
    resumeId,
    resumeText,
    jobDescription,
  })
  return response.data
}

// ── Feature 3: Adaptive Next Question ─────────────────────────────────────────
export const getNextQuestion = async ({ previousQuestions, runningScore, resumeText, jobDescription }) => {
  const response = await api.post('/api/interview/next-question', {
    previousQuestions,
    runningScore,
    resumeText,
    jobDescription,
  })
  return response.data
}

// ── Live Code Execution (Judge0) ──────────────────────────────────────────────
export const runUserCode = async ({ code, language, questionId }) => {
  const response = await api.post('/api/interview/run-code', {
    code,
    language,
    questionId,
  })
  return response.data
}

// ── Grammar Check (LanguageTool) ──────────────────────────────────────────────
export const checkGrammar = async ({ text }) => {
  const response = await api.post('/api/interview/grammar-check', { text })
  return response.data
}

// ── Feature 4: Share & Comments ───────────────────────────────────────────────
export const shareReport = async (interviewId) => {
  const response = await api.post(`/api/interview/report/${interviewId}/share`)
  return response.data
}

export const getSharedReport = async (shareToken) => {
  const response = await api.get(`/api/interview/shared/${shareToken}`)
  return response.data
}

export const addMentorComment = async (shareToken, { author, text }) => {
  const response = await api.post(`/api/interview/shared/${shareToken}/comment`, {
    author,
    text,
  })
  return response.data
}
