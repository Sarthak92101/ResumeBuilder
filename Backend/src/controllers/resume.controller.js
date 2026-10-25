const resumeModel = require('../models/resume.model')
const { extractTextFromPdf } = require('../utils/pdf.util')
const mongoose = require('mongoose')

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
    const list = await resumeModel.find({ user: req.user.id }).sort({ createdAt: -1 }).select('fileName createdAt confirmedInterviewAchievements')
    res.status(200).json({ message: 'Resumes fetched', resumes: list })
  } catch (error) {
    console.error('List resumes error:', error)
    res.status(500).json({ message: 'Error fetching resumes', error: error.message })
  }
}

async function saveInterviewAchievementsController(req, res) {
  try {
    const { resumeId } = req.params
    if (!mongoose.isValidObjectId(resumeId)) return res.status(400).json({ message: 'Choose a valid resume' })
    const achievements = Array.isArray(req.body?.achievements) ? req.body.achievements : []
    if (!achievements.length || achievements.length > 10) {
      return res.status(400).json({ message: 'Choose between 1 and 10 resume additions to save' })
    }

    const cleaned = []
    for (const item of achievements) {
      const text = typeof item?.text === 'string' ? item.text.trim().slice(0, 500) : ''
      const sourceAnswer = typeof item?.sourceAnswer === 'string' ? item.sourceAnswer.trim().slice(0, 1800) : ''
      if (text.length < 15) {
        return res.status(400).json({ message: 'Each resume addition must be at least 15 characters' })
      }
      cleaned.push({ text, sourceAnswer, confirmedAt: new Date() })
    }

    const resume = await resumeModel.findOne({ _id: resumeId, user: req.user.id })
    if (!resume) return res.status(404).json({ message: 'Resume not found' })

    const existing = resume.confirmedInterviewAchievements || []
    const knownText = new Set(existing.map((item) => String(item.text || '').trim().toLowerCase()))
    const newAchievements = cleaned.filter((item) => !knownText.has(item.text.toLowerCase()))
    if (existing.length + newAchievements.length > 20) {
      return res.status(400).json({ message: 'This resume already has the maximum of 20 interview additions' })
    }
    for (const item of cleaned) {
      const key = item.text.toLowerCase()
      if (!knownText.has(key)) {
        existing.push(item)
        knownText.add(key)
      }
    }
    resume.confirmedInterviewAchievements = existing
    await resume.save()

    res.status(200).json({
      message: 'Resume additions saved for future ATS checks and SAVIK interviews',
      achievements: resume.confirmedInterviewAchievements,
    })
  } catch (error) {
    console.error('Save interview resume additions error:', error)
    res.status(500).json({ message: 'Could not save resume additions', error: error.message })
  }
}

module.exports = { uploadResumeController, listResumesController, saveInterviewAchievementsController }
