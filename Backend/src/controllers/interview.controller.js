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

    if (!jobDescription) {
      return res.status(400).json({
        message: "Job description is required",
      })
    }

    if (!req.file && !selfDescription) {
      return res.status(400).json({
        message: "Please upload a resume PDF or provide a self description",
      })
    }

    if (!req.user?.id) {
      return res.status(401).json({
        message: "User not authenticated",
      })
    }

    let resumeText = selfDescription

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
    })

    const interviewReport = await interviewReportModel.create({
      user: req.user.id,
      resume: resumeText,
      selfDescription,
      jobDescription,
      ...interviewReportByAi,
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
        "title matchScore createdAt updatedAt user"
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

module.exports = {
  generateInterviewReportController,
  getInterviewReportByIdController,
  getAllInterviewReportController,
  downloadInterviewReportPdfController,
}
