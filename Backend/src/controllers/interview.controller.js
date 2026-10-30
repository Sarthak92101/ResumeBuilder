const { extractTextFromPdf } = require("../utils/pdf.util")
const generateInterviewReport = require("../services/ai.service")
const {
  generateResumePdf,
  generateInterviewPlanPdf,
} = require("../services/pdfExport.service")
const interviewReportModel = require("../models/interviewReport.model")
const resumeModel = require("../models/resume.model")
const { fetchGitHubSummary } = require("../services/github.service")
const { fetchLeetCodeSummary } = require("../services/leetcode.service")
const { fetchCodeforcesSummary } = require("../services/codeforces.service")
const crypto = require("crypto")
const mongoose = require("mongoose")

async function generateInterviewReportController(req, res) {
  try {
    const jobDescription = req.body?.jobDescription?.trim()
    const selfDescription = req.body?.selfDescription?.trim() || ""
    const targetCompany = req.body?.targetCompany?.trim() || ""
    const interviewDate = req.body?.interviewDate ? new Date(req.body.interviewDate) : null
    const language = req.body?.language || "en"
    const githubUsername = req.body?.githubUsername?.trim() || ""
    const leetcodeUsername = req.body?.leetcodeUsername?.trim() || ""
    const codeforcesHandle = req.body?.codeforcesHandle?.trim() || ""

    if (!jobDescription) {
      return res.status(400).json({
        message: "Job description is required",
      })
    }

    if (!req.file && !selfDescription && !req.body?.resumeId) {
      return res.status(400).json({
        message: "Please upload a resume PDF, provide a self description, or select an existing resume",
      })
    }

    if (!req.user?.id) {
      return res.status(401).json({
        message: "User not authenticated",
      })
    }

    let resumeText = selfDescription
    let linkedResumeId = null

    // If the client provided a resumeId to reuse a previously uploaded resume
    if (req.body?.resumeId && !req.file) {
      try {
        const saved = await resumeModel
          .findOne({ _id: req.body.resumeId, user: req.user.id })
          .select("extractedText confirmedInterviewAchievements")
          .lean()
        if (saved) linkedResumeId = req.body.resumeId
        if (saved?.extractedText) {
          resumeText = appendConfirmedAchievements(saved.extractedText, saved.confirmedInterviewAchievements)
        }
      } catch (e) {
        console.warn("Could not load resume by id:", e.message)
      }
    }

    if (req.file) {
      console.log(
        "Processing PDF file:",
        req.file.originalname,
        "Size:",
        req.file.size
      )
      resumeText = await extractTextFromPdf(req.file.buffer)
      console.log("PDF parsed successfully, text length:", resumeText.length)
    }

    // Fetch optional profiles concurrently so the slowest profile request, rather
    // than the sum of all requests, determines the wait before AI generation.
    const warnings = []
    const profileSummaries = {
      githubSummary: null,
      leetcodeSummary: null,
      codeforcesSummary: null,
    }
    const profileRequests = [
      githubUsername && {
        key: "githubSummary",
        label: "GitHub",
        username: githubUsername,
        fetch: () => fetchGitHubSummary(githubUsername),
      },
      leetcodeUsername && {
        key: "leetcodeSummary",
        label: "LeetCode",
        username: leetcodeUsername,
        fetch: () => fetchLeetCodeSummary(leetcodeUsername),
      },
      codeforcesHandle && {
        key: "codeforcesSummary",
        label: "Codeforces",
        username: codeforcesHandle,
        fetch: () => fetchCodeforcesSummary(codeforcesHandle),
      },
    ].filter(Boolean)

    const profileResults = await Promise.allSettled(
      profileRequests.map(({ fetch }) => fetch())
    )

    profileResults.forEach((result, index) => {
      const { key, label, username } = profileRequests[index]
      if (result.status === "fulfilled") {
        profileSummaries[key] = result.value
        return
      }

      const message = result.reason?.message || String(result.reason)
      console.warn(`${label} profile fetch failed:`, message)
      warnings.push(`Couldn't fetch ${label} data for "${username}", continuing with resume only.`)
    })

    const { githubSummary, leetcodeSummary, codeforcesSummary } = profileSummaries

    const interviewReportByAi = await generateInterviewReport({
      resume: resumeText,
      selfDescription: selfDescription || resumeText,
      jobDescription,
      targetCompany,
      language,
      githubSummary,
      leetcodeSummary,
      codeforcesSummary,
    })

    // Save newly uploaded plan resumes into the shared resume library so SAVIK,
    // ATS, and other resume tools can reuse the same extracted text.
    if (req.file) {
      const savedResume = await resumeModel.create({
        user: req.user.id,
        fileName: req.file.originalname,
        extractedText: resumeText,
      })
      linkedResumeId = savedResume._id
    }

    const interviewReport = await interviewReportModel.create({
      user: req.user.id,
      resumeId: linkedResumeId,
      resume: resumeText,
      selfDescription,
      jobDescription,
      targetCompany,
      interviewDate,
      language,
      matchScore: interviewReportByAi.matchScore,
      score: interviewReportByAi.score,
      title: interviewReportByAi.title,
      technicalQuestions: interviewReportByAi.technicalQuestions,
      behaviouralQuestions: interviewReportByAi.behaviouralQuestions,
      skillGaps: interviewReportByAi.skillGaps,
      preparationPlan: interviewReportByAi.preparationPlan,
      proofClaims: interviewReportByAi.proofClaims || [],
      githubSummary,
      leetcodeSummary,
      codeforcesSummary,
    })

    res.status(201).json({
      message: "Interview report generated successfully",
      interviewReport,
      warnings,
    })
  } catch (error) {
    console.error("Generate Interview Report Error:", error.message)

    const msg = error.message || "Error generating interview report"
    const isQuota = msg.toLowerCase().includes("quota")
    const isJson = msg.toLowerCase().includes("json")
    const status = isQuota ? 429 : isJson ? 502 : 500

    res.status(status).json({
      message: msg,
    })
  }
}

async function getInterviewReportByIdController(req, res) {
  try {
    const { interviewId } = req.params
    const interviewReport = await interviewReportModel.findOne({
      _id: interviewId,
      user: req.user.id,
    })

    if (!interviewReport) {
      return res.status(404).json({
        message: "Interview report not found",
      })
    }

    // Older plans stored extracted resume text on the report but did not link a
    // library resume. Import it once so SAVIK and ATS can reuse those plans too.
    if (!interviewReport.resumeId && interviewReport.resume?.trim()) {
      const importedFileName = `Resume from ${String(interviewReport.title || "interview plan").trim().slice(0, 120)}`
      let savedResume = await resumeModel
        .findOne({ user: req.user.id, fileName: importedFileName, extractedText: interviewReport.resume })
        .select("_id")

      if (!savedResume) {
        savedResume = await resumeModel.create({
          user: req.user.id,
          fileName: importedFileName,
          extractedText: interviewReport.resume,
        })
      }

      interviewReport.resumeId = savedResume._id
      await interviewReport.save()
    }

    res.status(200).json({
      message: "Interview report found",
      interviewReport,
    })
  } catch (error) {
    console.error("Get Interview Report By ID Error:", error)
    res.status(500).json({
      message: "Error fetching interview report",
      error: error.message,
    })
  }
}

async function getAllInterviewReportController(req, res) {
  try {
    const interviewReport = await interviewReportModel
      .find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .select(
        "title matchScore score createdAt updatedAt user"
      )

    res.status(200).json({
      message: "Interview report found",
      interviewReport,
    })
  } catch (error) {
    console.error("Get All Interview Reports Error:", error)
    res.status(500).json({
      message: "Error fetching interview reports",
      error: error.message,
    })
  }
}

async function getInterviewStatsController(req, res) {
  try {
    const reports = await interviewReportModel
      .find({ user: req.user.id })
      .sort({ createdAt: 1 })
      .select('score createdAt')

    const scores = reports.map(r => ({ score: r.score ?? null, createdAt: r.createdAt }))
    const validScores = scores.map(s => (typeof s.score === 'number' ? s.score : null)).filter(v => v !== null)
    const avg = validScores.length ? (validScores.reduce((a, b) => a + b, 0) / validScores.length) : null

    res.status(200).json({ message: 'Stats fetched', scores, average: avg })
  } catch (error) {
    console.error('Get interview stats error:', error)
    res.status(500).json({ message: 'Error fetching stats', error: error.message })
  }
}

async function downloadInterviewReportPdfController(req, res) {
  try {
    const { interviewId } = req.params
    const type = req.query.type === "plan" ? "plan" : "resume"

    const interviewReport = await interviewReportModel.findOne({
      _id: interviewId,
      user: req.user.id,
    })

    if (!interviewReport) {
      return res.status(404).json({ message: "Interview report not found" })
    }

    if (type === "resume" && !interviewReport.resume) {
      return res.status(400).json({ message: "No resume text available for this report" })
    }

    const pdfBuffer =
      type === "plan"
        ? await generateInterviewPlanPdf(interviewReport)
        : await generateResumePdf(interviewReport)

    const slug = (interviewReport.title || "interview-report")
      .replace(/[^a-z0-9]+/gi, "-")
      .toLowerCase()

    res.setHeader("Content-Type", "application/pdf")
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${slug}-${type}.pdf"`
    )
    res.send(pdfBuffer)
  } catch (error) {
    console.error("PDF export error:", error.message)
    const status = error.code === "LATEX_COMPILER_MISSING" ? 503 : error.code === "LATEX_COMPILATION_TIMEOUT" ? 504 : 500
    res.status(status).json({
      message: error.message || "Failed to generate PDF",
    })
  }
}

async function atsScoreController(req, res) {
  try {
    const resumeText = req.body?.resumeText?.trim()
    const jobDescription = req.body?.jobDescription?.trim()
    const targetCompany = req.body?.targetCompany?.trim() || ""

    if (!resumeText || !jobDescription) {
      return res.status(400).json({ message: "resumeText and jobDescription are required" })
    }

    const { getAtsResumeScore } = require("../services/ai.service")
    const score = await getAtsResumeScore({ resumeText, jobDescription, targetCompany })

    res.status(200).json({ message: "ATS score calculated", score })
  } catch (error) {
    console.error("ATS score error:", error)
    res.status(500).json({ message: error.message || "Failed to calculate ATS score" })
  }
}

async function starCheckController(req, res) {
  try {
    const questionText = req.body?.questionText?.trim()
    const userAnswer = req.body?.userAnswer?.trim()

    if (!questionText || !userAnswer) {
      return res.status(400).json({ message: "questionText and userAnswer are required" })
    }

    const { getStarCheckFeedback } = require("../services/ai.service")
    const feedback = await getStarCheckFeedback({ questionText, userAnswer })

    res.status(200).json({ message: "STAR feedback generated", feedback })
  } catch (error) {
    console.error("STAR check error:", error)
    res.status(500).json({ message: error.message || "Failed to evaluate answer" })
  }
}

async function checkProofClaimController(req, res) {
  try {
    const { interviewId, claimId } = req.params
    const answer = String(req.body?.answer || "").trim()
    const evidenceNote = String(req.body?.evidenceNote || "").trim()
    const evidenceUrl = String(req.body?.evidenceUrl || "").trim()

    if (!answer) {
      return res.status(400).json({ message: "Write an answer before checking this claim" })
    }
    if (answer.length > 4000 || evidenceNote.length > 1500 || evidenceUrl.length > 500) {
      return res.status(400).json({ message: "Answer or evidence is too long" })
    }
    if (evidenceUrl) {
      try {
        const parsedUrl = new URL(evidenceUrl)
        if (!(["http:", "https:"].includes(parsedUrl.protocol))) throw new Error("Unsupported URL scheme")
      } catch {
        return res.status(400).json({ message: "Evidence link must be a valid HTTP or HTTPS URL" })
      }
    }

    const report = await interviewReportModel.findOne({ _id: interviewId, user: req.user.id })
    if (!report) {
      return res.status(404).json({ message: "Interview report not found" })
    }

    const claim = report.proofClaims.id(claimId)
    if (!claim) {
      return res.status(404).json({ message: "Resume claim not found in this report" })
    }

    const { getProofClaimFeedback } = require("../services/ai.service")
    const feedback = await getProofClaimFeedback({
      claim: claim.claim,
      sourceText: claim.sourceText,
      skill: claim.skill,
      challengeQuestion: claim.challengeQuestion,
      answer,
      evidenceNote,
      evidenceUrl,
      language: report.language,
    })

    claim.attempts.push({ answer, evidenceNote, evidenceUrl, ...feedback })
    if (claim.attempts.length > 8) {
      claim.attempts.splice(0, claim.attempts.length - 8)
    }
    await report.save()

    res.status(200).json({
      message: "Resume claim answer checked",
      proofClaim: claim.toObject(),
    })
  } catch (error) {
    console.error("Proof claim check error:", error)
    res.status(500).json({ message: error.message || "Failed to check resume claim" })
  }
}

// ── Feature 1: Voice Feedback ─────────────────────────────────────────────────
async function voiceFeedbackController(req, res) {
  try {
    const questionText = req.body?.questionText?.trim()
    const transcript = req.body?.transcript?.trim()

    if (!questionText || !transcript) {
      return res.status(400).json({ message: "questionText and transcript are required" })
    }

    const { getVoiceFeedback } = require("../services/ai.service")
    const feedback = await getVoiceFeedback({ questionText, transcript })

    res.status(200).json({ message: "Voice feedback generated", feedback })
  } catch (error) {
    console.error("Voice feedback error:", error)
    res.status(500).json({ message: error.message || "Failed to generate voice feedback" })
  }
}

async function avatarInterviewController(req, res) {
  const streamTurn = req.body?.stream === true && req.body?.action === "turn"

  try {
    const action = req.body?.action
    const message = typeof req.body?.message === "string" ? req.body.message.trim() : ""
    const resumeId = req.body?.resumeId
    const targetRole = typeof req.body?.targetRole === "string" ? req.body.targetRole.trim().slice(0, 100) : ""
    const language = ["hinglish", "en", "hi"].includes(req.body?.language) ? req.body.language : "hinglish"
    const candidateIntro = typeof req.body?.candidateIntro === "string" ? req.body.candidateIntro.trim().slice(0, 500) : ""
    const history = Array.isArray(req.body?.history)
      ? req.body.history
        .filter((item) => ["user", "assistant"].includes(item?.role) && typeof item?.content === "string")
        .slice(-14)
        .map(({ role, content }) => ({ role, content: content.trim().slice(0, 1200) }))
        .filter((item) => item.content)
      : []

    if (!["start", "turn"].includes(action)) {
      return res.status(400).json({ message: "Choose start or turn for the avatar interview" })
    }
    if (!mongoose.isValidObjectId(resumeId)) {
      return res.status(400).json({ message: "Choose a valid saved CV to start the interview" })
    }
    if (!targetRole) {
      return res.status(400).json({ message: "Add the role you want to interview for" })
    }
    if (action === "turn" && !message) {
      return res.status(400).json({ message: "Add your answer to continue the interview" })
    }
    if (message.length > 1800) {
      return res.status(400).json({ message: "Answers must be 1,800 characters or fewer" })
    }

    const resumeModel = require("../models/resume.model")
    const resume = await resumeModel.findOne({ _id: resumeId, user: req.user.id }).select("fileName extractedText confirmedInterviewAchievements")
    if (!resume) {
      return res.status(404).json({ message: "That CV wasn't found in your saved resumes" })
    }
    if (!resume.extractedText?.trim()) {
      return res.status(422).json({ message: "We couldn't read text from this CV. Try another text-based PDF." })
    }

    if (streamTurn) {
      res.status(200)
      res.set({
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      })
      res.flushHeaders?.()
    }

    const { getAvatarInterviewTurn } = require("../services/ai.service")
    const reply = await getAvatarInterviewTurn({
      action,
      resumeText: resume.extractedText,
      resumeAchievements: resume.confirmedInterviewAchievements,
      targetRole,
      language,
      candidateIntro,
      history,
      onChunk: streamTurn
        ? (text) => {
            if (!res.destroyed) res.write(`data: ${JSON.stringify({ type: "delta", text })}\n\n`)
          }
        : undefined,
    })

    if (streamTurn) {
      if (!res.destroyed) {
        res.write(`data: ${JSON.stringify({ type: "done", reply })}\n\n`)
        res.end()
      }
      return
    }

    res.status(200).json({ message: "Avatar interview turn ready", reply, resumeName: resume.fileName })
  } catch (error) {
    console.error("Avatar interview error:", error)
    if (res.headersSent) {
      if (!res.destroyed) {
        res.write(`data: ${JSON.stringify({ type: "error", message: error.message || "The AI interviewer couldn't continue right now" })}\n\n`)
        res.end()
      }
      return
    }
    res.status(500).json({ message: error.message || "The AI interviewer couldn't continue right now" })
  }
}

async function avatarResumeInsightsController(req, res) {
  try {
    const resumeId = req.body?.resumeId
    const targetRole = typeof req.body?.targetRole === 'string' ? req.body.targetRole.trim().slice(0, 100) : ''
    const conversation = Array.isArray(req.body?.conversation)
      ? req.body.conversation
        .filter((item) => ['user', 'assistant'].includes(item?.role) && typeof item?.content === 'string')
        .slice(-30)
        .map(({ role, content }) => ({ role, content: content.trim().slice(0, role === 'user' ? 1800 : 800) }))
        .filter((item) => item.content)
      : []

    if (!mongoose.isValidObjectId(resumeId)) {
      return res.status(400).json({ message: 'Choose a valid saved CV to review interview answers' })
    }
    if (!conversation.some((item) => item.role === 'user')) {
      return res.status(400).json({ message: 'SAVIK needs at least one spoken answer to find resume additions' })
    }

    const resumeModel = require('../models/resume.model')
    const resume = await resumeModel.findOne({ _id: resumeId, user: req.user.id }).select('extractedText confirmedInterviewAchievements')
    if (!resume) return res.status(404).json({ message: 'That CV was not found in your saved resumes' })

    const { getInterviewResumeSuggestions } = require('../services/ai.service')
    const result = await getInterviewResumeSuggestions({
      resumeText: resume.extractedText || '',
      conversation,
      targetRole,
      existingAchievements: resume.confirmedInterviewAchievements,
    })
    res.status(200).json({ message: 'Resume additions drafted', suggestions: result.suggestions })
  } catch (error) {
    console.error('Avatar interview resume insights error:', error)
    res.status(502).json({ message: error.message || 'SAVIK could not prepare resume additions right now' })
  }
}

function appendConfirmedAchievements(resumeText, achievements = []) {
  const additions = (achievements || [])
    .map((item) => String(item.text || '').trim())
    .filter(Boolean)
  if (!additions.length) return resumeText
  return `${resumeText}\n\nInterview Additions:\n${additions.map((item) => `- ${item}`).join('\n')}`
}

// ── Feature 2: Gap Analysis ───────────────────────────────────────────────────
async function gapAnalysisController(req, res) {
  try {
    const { resumeId, resumeText: resumeTextRaw, jobDescription } = req.body || {}

    if (!jobDescription?.trim()) {
      return res.status(400).json({ message: "jobDescription is required" })
    }

    let resumeText = resumeTextRaw?.trim() || ""

    if (!resumeText && resumeId) {
      const resumeModel = require("../models/resume.model")
      const saved = await resumeModel.findOne({ _id: resumeId, user: req.user.id })
      if (saved?.extractedText) {
        resumeText = saved.extractedText
      }
    }

    if (!resumeText) {
      return res.status(400).json({ message: "resumeText or resumeId with extracted text is required" })
    }

    const { analyzeResumeToJobGaps } = require("../services/localResumeAnalysis.service")
    const analysis = analyzeResumeToJobGaps(resumeText, jobDescription.trim())

    res.status(200).json({ message: "Gap analysis generated", analysis })
  } catch (error) {
    console.error("Gap analysis error:", error)
    res.status(500).json({ message: error.message || "Failed to generate gap analysis" })
  }
}

// ── Feature 3: Adaptive Next Question ─────────────────────────────────────────
async function nextQuestionController(req, res) {
  try {
    const { previousQuestions, runningScore, resumeText, jobDescription } = req.body || {}

    if (typeof runningScore !== "number") {
      return res.status(400).json({ message: "runningScore (number) is required" })
    }

    const { getNextQuestion } = require("../services/ai.service")
    const question = await getNextQuestion({
      previousQuestions: previousQuestions || [],
      runningScore,
      resumeText: resumeText || "",
      jobDescription: jobDescription || "",
    })

    res.status(200).json({ message: "Next question generated", question })
  } catch (error) {
    console.error("Next question error:", error)
    res.status(500).json({ message: error.message || "Failed to generate next question" })
  }
}

// ── Live Code Execution (Judge0) ─────────────────────────────────────────────
async function runCodeController(req, res) {
  try {
    const code = req.body?.code
    const language = req.body?.language
    const questionId = req.body?.questionId

    if (!code?.trim()) {
      return res.status(400).json({ message: "code is required" })
    }
    if (!language) {
      return res.status(400).json({ message: "language is required" })
    }
    if (!questionId) {
      return res.status(400).json({ message: "questionId is required" })
    }

    const report = await interviewReportModel.findOne({
      user: req.user.id,
      $or: [
        { "technicalQuestions._id": questionId },
        { "behaviouralQuestions._id": questionId },
      ],
    })

    if (!report) {
      return res.status(404).json({ message: "Question not found for this report" })
    }

    const question =
      (report.technicalQuestions || []).find((q) => String(q._id) === String(questionId)) ||
      (report.behaviouralQuestions || []).find((q) => String(q._id) === String(questionId))

    if (!question) {
      return res.status(404).json({ message: "Question not found" })
    }

    const testCases = question.testCases || []
    if (!testCases.length) {
      return res.status(400).json({
        message: "Only coding questions with test cases can be run. This question has no executable test cases.",
      })
    }

    const { runCodeAgainstTestCases } = require("../services/codeExecution.service")
    const result = await runCodeAgainstTestCases({ code, language, testCases })

    res.status(200).json({ message: "Code executed", result, questionId })
  } catch (error) {
    console.error("Run code error:", error)
    const msg = error.message || "Couldn't run code right now, try again"
    const isConfigError = error.code === "JUDGE0_NOT_CONFIGURED"

    res.status(isConfigError ? 503 : 200).json({
      message: msg,
      error: msg,
    })
  }
}

// ── Grammar Check (LanguageTool) ──────────────────────────────────────────────
async function grammarCheckController(req, res) {
  try {
    const text = req.body?.text

    if (!text?.trim()) {
      return res.status(400).json({ message: "text is required" })
    }

    const { checkGrammar } = require("../services/grammar.service")
    const result = await checkGrammar({ text })

    res.status(200).json({ message: "Grammar check complete", ...result })
  } catch (error) {
    console.error("Grammar check error:", error)
    res.status(200).json({
      message: error.message || "Couldn't check grammar right now, try again",
      error: error.message || "Couldn't check grammar right now, try again",
      issues: [],
    })
  }
}

// ── Feature 4: Mentor Share Link ──────────────────────────────────────────────
async function shareReportController(req, res) {
  try {
    const { interviewId } = req.params
    const report = await interviewReportModel.findOne({ _id: interviewId, user: req.user.id })

    if (!report) {
      return res.status(404).json({ message: "Interview report not found" })
    }

    if (!report.shareToken) {
      report.shareToken = crypto.randomUUID()
      await report.save()
    }

    res.status(200).json({ message: "Share link created", shareToken: report.shareToken })
  } catch (error) {
    console.error("Share report error:", error)
    res.status(500).json({ message: error.message || "Failed to create share link" })
  }
}

async function getSharedReportController(req, res) {
  try {
    const { shareToken } = req.params
    const report = await interviewReportModel.findOne({ shareToken })
      .select("title matchScore score technicalQuestions behaviouralQuestions skillGaps preparationPlan language createdAt mentorComments")

    if (!report) {
      return res.status(404).json({ message: "Report not found or no longer shared" })
    }

    res.status(200).json({ message: "Shared report found", report })
  } catch (error) {
    console.error("Get shared report error:", error)
    res.status(500).json({ message: error.message || "Failed to fetch shared report" })
  }
}

async function addMentorCommentController(req, res) {
  try {
    const { shareToken } = req.params
    const { author, text } = req.body || {}

    if (!text?.trim()) {
      return res.status(400).json({ message: "Comment text is required" })
    }

    const report = await interviewReportModel.findOne({ shareToken })
    if (!report) {
      return res.status(404).json({ message: "Report not found" })
    }

    report.mentorComments.push({
      author: author?.trim() || "Anonymous Mentor",
      text: text.trim(),
    })
    await report.save()

    res.status(201).json({ message: "Comment added", comment: report.mentorComments[report.mentorComments.length - 1] })
  } catch (error) {
    console.error("Add mentor comment error:", error)
    res.status(500).json({ message: error.message || "Failed to add comment" })
  }
}

module.exports = {
  generateInterviewReportController,
  getInterviewReportByIdController,
  getAllInterviewReportController,
  downloadInterviewReportPdfController,
  getInterviewStatsController,
  atsScoreController,
  starCheckController,
  checkProofClaimController,
  voiceFeedbackController,
  avatarInterviewController,
  avatarResumeInsightsController,
  gapAnalysisController,
  nextQuestionController,
  runCodeController,
  grammarCheckController,
  shareReportController,
  getSharedReportController,
  addMentorCommentController,
}
