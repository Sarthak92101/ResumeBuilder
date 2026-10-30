const STOP_WORDS = new Set([
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

const normalizeText = (value) => String(value || '')
  .toLowerCase()
  .replace(/node\.?\s*js/g, ' nodejs ')
  .replace(/c\+\+/g, ' cplusplus ')
  .replace(/c#/g, ' csharp ')
  .replace(/\.net/g, ' dotnet ')
  .replace(/reactjs/g, ' react ')
  .replace(/[^a-z0-9]+/g, ' ')
  .trim()

function getJobTerms(jobDescription) {
  const counts = new Map()
  for (const token of normalizeText(jobDescription).split(/\s+/).filter(Boolean)) {
    if (token.length < 3 || STOP_WORDS.has(token)) continue
    counts.set(token, (counts.get(token) || 0) + 1)
  }
  return [...counts.keys()].sort((a, b) => counts.get(b) - counts.get(a) || b.length - a.length)
}

function findSkillsSection(resumeText) {
  const lines = String(resumeText || '').split(/\r?\n/)
  const sectionHeading = /^\s*(?:professional\s+)?(?:summary|profile|objective|skills?(?:\s+and\s+tools)?|core competencies|experience|employment|education|projects?|certifications?|licenses?|awards|publications)\s*:?[\s]*$/i
  const skillsHeading = /^\s*(?:technical\s+)?skills?(?:\s+and\s+tools)?\s*:?\s*(.*)$/i
  const start = lines.findIndex((line) => skillsHeading.test(line))
  if (start < 0) return { found: false, text: '' }

  const firstLine = lines[start].match(skillsHeading)?.[1] || ''
  const content = [firstLine]
  for (let index = start + 1; index < lines.length; index += 1) {
    if (sectionHeading.test(lines[index])) break
    content.push(lines[index])
  }
  return { found: true, text: content.join(' ') }
}

function analyzeResumeToJobGaps(resumeText = '', jobDescription = '') {
  const resumeTokens = new Set(normalizeText(resumeText).split(/\s+/).filter(Boolean))
  const skillsSection = findSkillsSection(resumeText)
  const skillTokens = new Set(normalizeText(skillsSection.text).split(/\s+/).filter(Boolean))
  const statusOrder = { Learn: 0, 'Add to resume': 1, Have: 2 }

  const gaps = getJobTerms(jobDescription).map((skill) => {
    const inResume = resumeTokens.has(skill)
    const inSkillsSection = skillTokens.has(skill)
    const status = !inResume
      ? 'Learn'
      : skillsSection.found && !inSkillsSection
        ? 'Add to resume'
        : 'Have'
    const suggestion = status === 'Have'
      ? `Keep ${skill} visible and support it with a project or work example.`
      : status === 'Add to resume'
        ? `Your resume mentions ${skill}; add it to the Skills section and connect it to that experience.`
        : `This term was not found in your resume. Learn it or build evidence before listing it.`

    return { skill, status, suggestion }
  })

  return {
    gaps: gaps
      .sort((a, b) => statusOrder[a.status] - statusOrder[b.status])
      .slice(0, 10),
  }
}

module.exports = { analyzeResumeToJobGaps }
