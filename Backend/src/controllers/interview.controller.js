const pdfParser = require("pdf-parse")
const generateInterviewReport = require("../services/ai.service")
const interviewReportModel = require("../models/interviewReport.model")

async function generateInterviewReportController(req, res) {
  const resumeContent = await pdfParser(req.file.buffer)
  const { selfDescription, jobDescription } = req.body
  const interviewReportByAi = await generateInterviewReport({
    resume: resumeContent.text,
    selfDescription,
    jobDescription,
  })
    const interviewReport=await interviewReportModel.create({
      user:req.user.id,
      resume:resumeContent.text,
      selfDescription,
      jobDescription,
      ...interviewReportByAi
    })

    res.status(201).json({
      message:"Interview report generated successfully",
      interviewReport
    })

}
module.exports = { generateInterviewReportController } 