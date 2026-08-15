const resumeModel = require('../models/resume.model')
const atsModel = require('../models/ats.model')
const aiService = require('../services/ai.service')

async function createAtsScoreController(req, res) {
  try {
    const { resumeId, jobDescription } = req.body || {}
    if (!resumeId) return res.status(400).json({ message: 'resumeId is required' })

    const resume = await resumeModel.findById(resumeId)
    if (!resume) return res.status(404).json({ message: 'Resume not found' })
    if (String(resume.user) !== String(req.user.id)) return res.status(403).json({ message: 'Forbidden' })

    const resumeText = resume.extractedText
    if (!resumeText) return res.status(400).json({ message: 'No extracted text available for this resume' })

    const jobDesc = jobDescription && String(jobDescription).trim().length ? jobDescription : 'General resume assessment: no job description provided.'

    let aiResult
    let usedFallback = false

    // If Gemini key isn't configured, skip AI and use fallback
    if (!process.env.GOOGLE_API_KEY) {
      usedFallback = true
      console.warn('GOOGLE_API_KEY missing — using local ATS fallback')
      aiResult = computeFallbackAts(resumeText, jobDesc)
    } else {
      try {
        aiResult = await aiService.getDetailedAtsScore({ resumeText, jobDescription: jobDesc })
      } catch (err) {
        console.error('AI ATS scoring failed:', err)
        // fallback to local scorer instead of failing the request
        usedFallback = true
        aiResult = computeFallbackAts(resumeText, jobDesc)
      }
    }

    const doc = await atsModel.create({
      resume: resume._id,
      user: req.user.id,
      overallScore: Number(aiResult.overallScore ?? 0),
      breakdown: {
        keywordMatch: Number(aiResult.breakdown?.keywordMatch ?? 0),
        formatting: Number(aiResult.breakdown?.formatting ?? 0),
        achievements: Number(aiResult.breakdown?.achievements ?? 0),
        actionVerbs: Number(aiResult.breakdown?.actionVerbs ?? 0),
        sectionCompleteness: Number(aiResult.breakdown?.sectionCompleteness ?? 0),
      },
      missingKeywords: aiResult.missingKeywords || [],
      suggestions: aiResult.suggestions || [],
      rawResponse: { _source: usedFallback ? 'fallback' : 'gemini', data: aiResult },
    })

    res.status(201).json({ message: 'ATS score created', score: doc })
  } catch (error) {
    console.error('Create ATS score error:', error)
    res.status(500).json({ message: 'Error creating ATS score', error: error.message })
  }
}

async function listAtsScoresController(req, res) {
  try {
    const { resumeId } = req.params
    if (!resumeId) return res.status(400).json({ message: 'resumeId is required' })

    const scores = await atsModel.find({ resume: resumeId, user: req.user.id }).sort({ createdAt: -1 })
    res.status(200).json({ message: 'ATS scores fetched', scores })
  } catch (error) {
    console.error('List ATS scores error:', error)
    res.status(500).json({ message: 'Error fetching ATS scores', error: error.message })
  }
}

module.exports = { createAtsScoreController, listAtsScoresController }

function computeFallbackAts(resumeText = '', jobDescription = '') {
  const resume = String(resumeText || '').toLowerCase()
  const job = String(jobDescription || '').toLowerCase()

  const jobWords = job.split(/[^a-z0-9]+/).filter(Boolean)
  const uniqueJobWords = Array.from(new Set(jobWords))

  const matched = []
  const missing = []

  uniqueJobWords.forEach((w) => {
    if (w.length < 3) return
    if (resume.includes(w)) matched.push(w)
    else missing.push(w)
  })

  // formatting heuristic: penalize PDFs with poor parse (many short lines)
  const lines = resume.split('\n').map(l => l.trim())
  const shortLines = lines.filter(l => l.length > 0 && l.length < 40).length
  const formatting = Math.max(0, 100 - Math.min(80, Math.round((shortLines / Math.max(1, lines.length)) * 100)))

  // achievements heuristic: count numeric occurrences or words like 'achieved', 'increased'
  const achKeywords = ['achieved','increased','reduced','improved','delivered','launched']
  const achievements = Math.min(100, (resume.split(/\d+/).length - 1) * 15 + achKeywords.reduce((s,k)=> s + (resume.includes(k)?10:0),0))

  // action verbs heuristic
  const verbs = ['led','developed','implemented','designed','created','managed','improved','optimized','built']
  const actionVerbs = Math.min(100, verbs.reduce((s,k)=> s + (resume.includes(k)?12:0),0))

  // section completeness
  const sections = ['contact','skills','experience','education','project','projects']
  const foundSections = sections.filter(s => resume.includes(s)).length
  const sectionCompleteness = Math.round((foundSections / sections.length) * 100)

  const overall = Math.round(( (matched.length ? 30 : 0) + formatting*0.2 + achievements*0.2 + actionVerbs*0.2 + sectionCompleteness*0.2 ))

  const suggestions = []
  if (!resume.includes('contact')) suggestions.push('Add a contact section with email and phone')
  if (matched.length === 0 && uniqueJobWords.length > 0) suggestions.push('Add keywords from the job description into your skills and experience')
  if (achievements < 20) suggestions.push('Quantify achievements with metrics and numbers')

  return {
    overallScore: Math.min(100, Math.max(0, overall)),
    breakdown: {
      keywordMatch: matched.length && uniqueJobWords.length ? Math.round((matched.length/uniqueJobWords.length)*100) : 0,
      formatting: formatting,
      achievements: achievements,
      actionVerbs: actionVerbs,
      sectionCompleteness: sectionCompleteness,
    },
    missingKeywords: missing.slice(0, 20),
    suggestions,
  }
}
