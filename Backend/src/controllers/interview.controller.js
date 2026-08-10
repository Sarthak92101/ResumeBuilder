const { extractTextFromPdf } = require("../utils/pdf.util")
const generateInterviewReport = require("../services/ai.service")
const {
  generateResumePdf,
  generateInterviewPlanPdf,
} = require("../services/pdfExport.service")
const interviewReportModel = require("../models/interviewReport.model")

async function generateInterviewReportController(req, res) {
  try {
    const jobDescription = req.body?.jobDescription?.trim()
    const selfDescription = req.body?.selfDescription?.trim() || ""
    const targetCompany = req.body?.targetCompany?.trim() || ""
    const interviewDate = req.body?.interviewDate ? new Date(req.body.interviewDate) : null

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

    // If the client provided a resumeId to reuse a previously uploaded resume
    if (req.body?.resumeId) {
      try {
        const resumeModel = require("../models/resume.model")
        const saved = await resumeModel.findOne({ _id: req.body.resumeId, user: req.user.id })
        if (saved?.extractedText) {
          resumeText = saved.extractedText
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

    const interviewReportByAi = await generateInterviewReport({
      resume: resumeText,
      selfDescription: selfDescription || resumeText,
      jobDescription,
      targetCompany,
    })

    const interviewReport = await interviewReportModel.create({
      user: req.user.id,
      resume: resumeText,
      selfDescription,
      jobDescription,
      targetCompany,
      interviewDate,
      matchScore: interviewReportByAi.matchScore,
      score: interviewReportByAi.score,
      title: interviewReportByAi.title,
      technicalQuestions: interviewReportByAi.technicalQuestions,
      behaviouralQuestions: interviewReportByAi.behaviouralQuestions,
      skillGaps: interviewReportByAi.skillGaps,
      preparationPlan: interviewReportByAi.preparationPlan,
    })

    res.status(201).json({
      message: "Interview report generated successfully",
      interviewReport,
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
    res.status(500).json({
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

module.exports = {
  generateInterviewReportController,
  getInterviewReportByIdController,
  getAllInterviewReportController,
  downloadInterviewReportPdfController,
  getInterviewStatsController,
  atsScoreController,
  starCheckController,
}
