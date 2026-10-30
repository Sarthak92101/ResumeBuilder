const resumeModel = require('../models/resume.model')
const atsModel = require('../models/ats.model')

async function createAtsScoreController(req, res) {
  try {
    const { resumeId, jobDescription } = req.body || {}
    if (!resumeId) return res.status(400).json({ message: 'resumeId is required' })

    const resume = await resumeModel.findById(resumeId)
    if (!resume) return res.status(404).json({ message: 'Resume not found' })
    if (String(resume.user) !== String(req.user.id)) return res.status(403).json({ message: 'Forbidden' })

    const baseResumeText = resume.extractedText
    if (!baseResumeText) return res.status(400).json({ message: 'No extracted text available for this resume' })
    const confirmedAdditions = (resume.confirmedInterviewAchievements || []).map((item) => String(item.text || '').trim()).filter(Boolean)
    const resumeText = confirmedAdditions.length
      ? `${baseResumeText}\n\nCandidate-confirmed interview additions (self-reported; not part of uploaded PDF):\n${confirmedAdditions.map((item) => `- ${item}`).join('\n')}`
      : baseResumeText
    const jobDesc = typeof jobDescription === 'string' ? jobDescription.trim() : ''
    const aiResult = computeLocalAts(resumeText, jobDesc)

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
      rawResponse: { _source: 'local', data: aiResult },
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

function computeLocalAts(resumeText = '', jobDescription = '') {
  const rawResume = String(resumeText || '')
  const normalize = (value) => String(value || '')
    .toLowerCase()
    .replace(/node\.?\s*js/g, ' nodejs ')
    .replace(/c\+\+/g, ' cplusplus ')
    .replace(/c#/g, ' csharp ')
    .replace(/\.net/g, ' dotnet ')
    .replace(/reactjs/g, ' react ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
  const stopWords = new Set([
    'about', 'above', 'across', 'after', 'all', 'also', 'an', 'and', 'any', 'are', 'as', 'at',
    'based', 'be', 'because', 'been', 'before', 'being', 'between', 'both', 'but', 'by', 'can',
    'candidate', 'company', 'could', 'demonstrated', 'description', 'develop', 'different', 'do',
    'each', 'either', 'excellent', 'experience', 'for', 'from', 'full', 'have', 'having', 'help',
    'high', 'ideal', 'in', 'including', 'into', 'is', 'it', 'its', 'job', 'join', 'looking', 'make',
    'may', 'more', 'most', 'must', 'new', 'not', 'of', 'on', 'one', 'or', 'our', 'own', 'position',
    'preferred', 'provide', 'required', 'requirement', 'requirements', 'responsibility', 'responsibilities',
    'role', 'seeking', 'skill', 'strong', 'such', 'team', 'than', 'that', 'the', 'their', 'them',
    'there', 'these', 'this', 'those', 'to', 'under', 'up', 'us', 'use', 'using', 'various', 'we',
    'well', 'what', 'when', 'where', 'which', 'while', 'who', 'will', 'with', 'within', 'work',
    'working', 'year', 'years', 'you', 'your',
  ])
  const tokens = (value) => normalize(value).split(/\s+/).filter(Boolean)
  const resumeTokens = new Set(tokens(rawResume))
  const jobTokens = tokens(jobDescription)
  const termCounts = new Map()
  for (const token of jobTokens) {
    if (token.length < 3 || stopWords.has(token)) continue
    termCounts.set(token, (termCounts.get(token) || 0) + 1)
  }

  const jobTerms = [...termCounts.keys()].sort((a, b) =>
    termCounts.get(b) - termCounts.get(a) || b.length - a.length,
  )
  const matchedKeywords = jobTerms.filter((term) => resumeTokens.has(term))
  const missingKeywords = jobTerms.filter((term) => !resumeTokens.has(term))
  const hasJobDescription = Boolean(String(jobDescription || '').trim())
  const keywordMatch = hasJobDescription
    ? Math.round((matchedKeywords.length / Math.max(1, jobTerms.length)) * 100)
    : 65

  const normalizedResume = normalize(rawResume)
  const sectionChecks = [
    { label: 'summary', present: /\b(summary|profile|objective)\b/.test(normalizedResume) },
    { label: 'skills', present: /\b(skills|technologies|technical)\b/.test(normalizedResume) },
    { label: 'experience', present: /\b(experience|employment|internship)\b/.test(normalizedResume) },
    { label: 'education', present: /\beducation\b/.test(normalizedResume) },
    { label: 'projects', present: /\bprojects?\b/.test(normalizedResume) },
    { label: 'certifications', present: /\b(certifications?|licenses?)\b/.test(normalizedResume) },
    { label: 'contact', present: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(rawResume) || /(?:\+?\d[\d\s().-]{7,}\d)/.test(rawResume) },
  ]
  const sectionsFound = sectionChecks.filter((section) => section.present).length
  const sectionCompleteness = Math.round((sectionsFound / sectionChecks.length) * 100)
  const lines = rawResume.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
  const veryShortLineRatio = lines.length
    ? lines.filter((line) => line.length < 4).length / lines.length
    : 1
  const formatting = Math.max(0, Math.min(100,
    72 + Math.min(18, sectionsFound * 3) + (lines.length > 8 ? 5 : 0)
    - (lines.length < 4 ? 20 : 0) - (veryShortLineRatio > 0.5 ? 10 : 0),
  ))

  const actionVerbs = [
    'achieved', 'analyzed', 'automated', 'built', 'created', 'decreased', 'delivered', 'designed',
    'developed', 'engineered', 'established', 'implemented', 'improved', 'increased', 'launched',
    'led', 'managed', 'mentored', 'migrated', 'optimized', 'reduced', 'resolved', 'scaled', 'streamlined',
  ]
  const actionVerbCount = actionVerbs.filter((verb) => new RegExp(`\\b${verb}\\b`).test(normalizedResume)).length
  const actionVerbScore = Math.min(100, 15 + actionVerbCount * 9)
  const measurableResults = rawResume.match(/\b\d+(?:\.\d+)?\s*(?:%|percent|x\b|k\b|m\b|million\b|thousand\b|users?\b|customers?\b|revenue\b|projects?\b|hours?\b|days?\b|weeks?\b)/gi) || []
  const achievements = Math.min(100, 35 + measurableResults.length * 12 + Math.min(actionVerbCount, 5) * 5)
  const overallScore = Math.round(
    keywordMatch * 0.4 + formatting * 0.15 + achievements * 0.15
    + actionVerbScore * 0.1 + sectionCompleteness * 0.2,
  )

  const suggestions = []
  if (!hasJobDescription) {
    suggestions.push('Add a job description to see role-specific keyword matching.')
  } else if (missingKeywords.length) {
    suggestions.push(`If they reflect your experience, include relevant role terms such as ${missingKeywords.slice(0, 4).join(', ')}.`)
  }
  if (!measurableResults.length) suggestions.push('Add measurable outcomes, such as time saved, users reached, or performance improved.')
  if (actionVerbCount < 3) suggestions.push('Start experience and project bullets with clear action verbs.')
  const missingSections = sectionChecks.filter((section) => !section.present).map((section) => section.label)
  if (missingSections.length) suggestions.push(`Consider adding relevant sections: ${missingSections.slice(0, 3).join(', ')}.`)

  return {
    overallScore: Math.max(0, Math.min(100, overallScore)),
    breakdown: {
      keywordMatch,
      formatting,
      achievements,
      actionVerbs: actionVerbScore,
      sectionCompleteness,
    },
    missingKeywords: hasJobDescription ? missingKeywords.slice(0, 12) : [],
    suggestions: suggestions.slice(0, 4),
  }
}
