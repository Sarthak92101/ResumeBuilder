const resumeModel = require('../models/resume.model')
const { extractTextFromPdf } = require('../utils/pdf.util')

async function uploadResumeController(req, res) {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' })
    const text = await extractTextFromPdf(req.file.buffer)
    const saved = await resumeModel.create({
      user: req.user.id,
      fileName: req.file.originalname,
      extractedText: text,
    })
    res.status(201).json({ message: 'Resume uploaded', resume: saved })
  } catch (error) {
    console.error('Upload resume error:', error)
    res.status(500).json({ message: 'Error uploading resume', error: error.message })
  }
}

async function listResumesController(req, res) {
  try {
    const list = await resumeModel.find({ user: req.user.id }).sort({ createdAt: -1 }).select('fileName createdAt')
    res.status(200).json({ message: 'Resumes fetched', resumes: list })
  } catch (error) {
    console.error('List resumes error:', error)
    res.status(500).json({ message: 'Error fetching resumes', error: error.message })
  }
}

module.exports = { uploadResumeController, listResumesController }
