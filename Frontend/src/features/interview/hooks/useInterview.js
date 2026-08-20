import { useCallback, useContext, useEffect } from "react"
import { useParams } from "react-router"
import { InterviewContext } from "../context"
import {
  generateInterviewReport,
  generateResumePdf,
  getAllInterviewReports,
  getInterviewReportById,
  getAtsScore,
  getStarCheck,
  getVoiceFeedback,
  getGapAnalysis,
  getNextQuestion,
  shareReport,
} from "../services/interview.api"

export const useInterview = () => {
  const context = useContext(InterviewContext)
  const { interviewId } = useParams()

  if (!context) {
    throw new Error("useInterview must be used within an InterviewProvider")
  }

  const { loading, setLoading, report, setReport, reports, setReports } = context

  const generateReport = useCallback(
    async ({ jobDescription, selfDescription, resumeFile, targetCompany, interviewDate, language }) => {
      setLoading(true)
      try {
        const response = await generateInterviewReport({
          jobDescription,
          selfDescription,
          resumeFile,
          targetCompany,
          interviewDate,
          language,
        })
        setReport(response.interviewReport)
        return response.interviewReport
      } finally {
        setLoading(false)
      }
    },
    [setLoading, setReport]
  )

  const getReportById = useCallback(
    async (id) => {
      setLoading(true)
      try {
        const response = await getInterviewReportById(id)
        setReport(response.interviewReport)
        return response.interviewReport
      } finally {
        setLoading(false)
      }
    },
    [setLoading, setReport]
  )

  const getReports = useCallback(async () => {
    try {
      const response = await getAllInterviewReports()
      setReports(response.interviewReport || [])
    } catch (error) {
      console.error("Failed to load reports:", error)
    }
  }, [setReports])

  const getResumePdf = useCallback(
    async (interviewReportId, type = "resume") => {
      try {
        const blob = await generateResumePdf({ interviewReportId, type })
        const url = window.URL.createObjectURL(
          new Blob([blob], { type: "application/pdf" })
        )
        const link = document.createElement("a")
        link.href = url
        link.download = `interview-${interviewReportId}-${type}.pdf`
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(url)
      } catch (error) {
        console.error("PDF download failed:", error)
        throw error
      }
    },
    []
  )

  const getAtsScoreForResume = useCallback(
    async ({ resumeText, jobDescription, targetCompany }) => {
      const response = await getAtsScore({ resumeText, jobDescription, targetCompany })
      return response.score
    },
    []
  )

  const getStarFeedback = useCallback(
    async ({ questionText, userAnswer }) => {
      const response = await getStarCheck({ questionText, userAnswer })
      return response.feedback
    },
    []
  )

  const requestVoiceFeedback = useCallback(
    async ({ interviewId, transcript }) => {
      const response = await getVoiceFeedback({ interviewId, transcript })
      return response.feedback
    },
    []
  )

  const requestGapAnalysis = useCallback(
    async ({ resumeId, jobDescription }) => {
      const response = await getGapAnalysis({ resumeId, jobDescription })
      return response.analysis
    },
    []
  )

  const requestNextQuestion = useCallback(
    async ({ previousQuestions, runningScore, resumeText, jobDescription }) => {
      const response = await getNextQuestion({ previousQuestions, runningScore, resumeText, jobDescription })
      return response.question
    },
    []
  )

  const shareInterviewReport = useCallback(
    async (interviewId) => {
      const response = await shareReport(interviewId)
      return response.shareToken
    },
    []
  )

  useEffect(() => {
    if (interviewId) {
      getReportById(interviewId)
    } else {
      getReports()
    }
  }, [interviewId, getReportById, getReports])

  return {
    loading,
    report,
    reports,
    generateReport,
    getReportById,
    getReports,
    getResumePdf,
    getAtsScoreForResume,
    getStarFeedback,
    requestVoiceFeedback,
    requestGapAnalysis,
    requestNextQuestion,
    shareInterviewReport,
  }
}
