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
}) => {
  if (resumeId) {
    const response = await api.post('/api/interview/', {
      jobDescription,
      selfDescription: selfDescription || '',
      resumeId,
      targetCompany,
      interviewDate,
      language,
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

  if (resumeFile) {
    formData.append("resume", resumeFile)
  }

  const response = await api.post("/api/interview/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  })
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
