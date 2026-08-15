const { GoogleGenAI } = require("@google/genai")
const { z } = require("zod")

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY,
})

function normalizeGeminiModel(value) {
  if (!value) return ""
  return String(value).trim().replace(/^['"]|['"]$/g, "")
}

const DEFAULT_MODELS = Array.from(
  new Set([
    normalizeGeminiModel(process.env.GEMINI_MODEL),
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-1.5-pro",
  ].filter(Boolean))
)

const MAX_RESUME_CHARS = 3500
const MAX_JOB_CHARS = 2500
const MAX_SELF_CHARS = 1500

const interviewReportSchema = z.object({
  matchScore: z.number().min(0).max(100),
  score: z.number().min(0).max(100),
  title: z.string().min(1),
  technicalQuestions: z.array(
    z.object({
      question: z.string(),
      difficulty: z.enum(["Easy", "Medium", "Hard"]),
      intention: z.string(),
      answer: z.string(),
      modelAnswer: z.string().optional(),
    })
  ),
  behaviouralQuestions: z.array(
    z.object({
      question: z.string(),
      difficulty: z.enum(["Easy", "Medium", "Hard"]),
      intention: z.string(),
      answer: z.string(),
      modelAnswer: z.string().optional(),
    })
  ),
  skillGaps: z.array(
    z.object({
      skill: z.string(),
      severity: z.enum(["low", "medium", "high"]),
    })
  ),
  preparationPlan: z.array(
    z.object({
      day: z.number(),
      focus: z.string(),
      tasks: z.array(z.string()),
    })
  ),
})

const atsScoreSchema = z.object({
  matchPercentage: z.number().min(0).max(100),
  matchedKeywords: z.array(z.string()),
  missingKeywords: z.array(z.string()),
})

const detailedAtsSchema = z.object({
  overallScore: z.number().min(0).max(100),
  breakdown: z.object({
    keywordMatch: z.number().min(0).max(100),
    formatting: z.number().min(0).max(100),
    achievements: z.number().min(0).max(100),
    actionVerbs: z.number().min(0).max(100),
    sectionCompleteness: z.number().min(0).max(100),
  }),
  missingKeywords: z.array(z.string()),
  suggestions: z.array(z.string()),
})

const starCheckSchema = z.object({
  situation: z.boolean(),
  task: z.boolean(),
  action: z.boolean(),
  result: z.boolean(),
  improvementAdvice: z.string().min(1),
})

function truncate(text, max) {
  const value = String(text || "").trim()
  if (value.length <= max) return value
  return `${value.slice(0, max)}…`
}

function parseGeminiError(error) {
  const raw = error?.message || String(error)

  try {
    const parsed = JSON.parse(raw)
    const apiError = parsed?.error || parsed
    const code = apiError?.code
    const status = apiError?.status || apiError?.error?.status
    const message = apiError?.message || apiError?.error?.message || raw

    if (code === 429 || status === "RESOURCE_EXHAUSTED" || raw.includes("quota")) {
      return new Error(
        "Gemini API quota exceeded. Wait a few minutes, try again later, or use a new API key from https://aistudio.google.com/apikey"
      )
    }

    if (code === 401 || code === 403 || status === "UNAUTHENTICATED") {
      return new Error(
        "Invalid or unauthorized Gemini API key. Check GOOGLE_API_KEY in Backend/.env"
      )
    }

    if (
      code === 400 ||
      status === "INVALID_ARGUMENT" ||
      /model.*(not found|not available|unsupported|not supported)|unsupported.*model|invalid.*model/i.test(message)
    ) {
      return new Error(
        "Gemini model is unavailable for this account. Set GEMINI_MODEL to a supported model like gemini-2.5-flash or gemini-2.0-flash in Backend/.env"
      )
    }

    return new Error(message)
  } catch {
    if (raw.includes("quota") || raw.includes("RESOURCE_EXHAUSTED")) {
      return new Error(
        "Gemini API quota exceeded. Wait a few minutes or create a new API key at https://aistudio.google.com/apikey"
      )
    }
    if (
      raw.includes("model not found") ||
      raw.includes("not available") ||
      raw.includes("unsupported") ||
      raw.includes("INVALID_ARGUMENT") ||
      raw.includes("is not supported")
    ) {
      return new Error(
        "Gemini model is unavailable for this account. Set GEMINI_MODEL to a supported model like gemini-2.5-flash or gemini-2.0-flash in Backend/.env"
      )
    }
    return new Error(raw)
  }
}

function extractGeminiTextFromResponse(response) {
  if (!response) return ""
  if (typeof response === "string") return response.trim()

  const directCandidates = [
    response.text,
    response.outputText,
    response.output_text,
    response.content,
    response.message,
    response.response,
  ]

  for (const candidate of directCandidates) {
    if (typeof candidate === "string" && candidate.trim()) return candidate.trim()
  }

  const flatten = (value, seen = new Set()) => {
    if (!value || typeof value !== "object") return []
    if (seen.has(value)) return []
    seen.add(value)

    const items = []

    if (typeof value.text === "string" && value.text.trim()) items.push(value.text.trim())
    if (typeof value.outputText === "string" && value.outputText.trim()) items.push(value.outputText.trim())

    if (Array.isArray(value)) {
      value.forEach((entry) => items.push(...flatten(entry, seen)))
      return items
    }

    Object.values(value).forEach((entry) => items.push(...flatten(entry, seen)))
    return items
  }

  const texts = flatten(response)
  const joined = texts
    .filter((text) => typeof text === "string" && text.trim())
    .map((text) => String(text).trim())
    .filter(Boolean)
    .join(" ")

  if (joined) return joined

  const candidateText = response?.candidates?.[0]?.content?.parts
    ?.map((part) => part?.text || "")
    .join(" ")

  if (candidateText && candidateText.trim()) return candidateText.trim()

  const outputText = response?.output?.map((o) => o.content?.map((c) => c.text || "").join(" ")).join(" ")
  if (outputText && outputText.trim()) return outputText.trim()

  return ""
}

async function callGemini(prompt, { jsonMode = true } = {}) {
  const models = DEFAULT_MODELS.length ? DEFAULT_MODELS : ["gemini-2.5-flash"]
  let lastError

  for (const model of models) {
    try {
      // Prefer the Interactions API if available on the client
      if (ai.interactions && typeof ai.interactions.create === "function") {
        console.log(`Calling Gemini Interactions API with model: ${model}`)
        const response = await ai.interactions.create({
          model,
          input: prompt,
        })

        const text = extractGeminiTextFromResponse(response)

        if (!text) throw new Error("Empty response from AI service")

        return text
      }

      // Fallback to older models.generateContent if interactions not available
      console.log(`Calling Gemini models.generateContent with model: ${model}`)
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: jsonMode
          ? {
              responseMimeType: "application/json",
            }
          : undefined,
      })

      const text = extractGeminiTextFromResponse(response)

      if (!text) {
        throw new Error("Empty response from AI service")
      }

      return text
    } catch (error) {
      lastError = parseGeminiError(error)
      const msg = String(lastError.message || "").toLowerCase()
      const isQuota = msg.includes("quota") || msg.includes("resource_exhausted")
      const isUnsupportedModel =
        msg.includes("model is unavailable") ||
        msg.includes("not found") ||
        msg.includes("not available") ||
        msg.includes("unsupported") ||
        msg.includes("invalid argument")

      if (isUnsupportedModel) {
        console.warn(`Model ${model} is unavailable, trying next supported model`)
        continue
      }

      if (!isQuota) {
        throw lastError
      }

      console.warn(`Model ${model} failed:`, lastError.message)
    }
  }

  throw lastError || new Error("All Gemini models failed")
}

function normalizeSeverity(value) {
  const severity = String(value || "medium").toLowerCase()
  if (severity === "low" || severity === "medium" || severity === "high") {
    return severity
  }
  return "medium"
}

function normalizeAiReport(raw) {
  const behaviouralQuestions = raw.behaviouralQuestions ?? raw.behavioralQuestions ?? []

  const normalizeQuestions = (questions) =>
    (questions || []).slice(0, 8).map((q) => {
      const answerText =
        q.answer ||
        q.modelAnswer ||
        q.model_answer ||
        q.response ||
        q.suggestedAnswer ||
        ""
      const modelAnswerText =
        q.modelAnswer ||
        q.model_answer ||
        q.modelAnswerText ||
        q.model_answer_text ||
        q.answer ||
        ""

      return {
        question: String(q.question || ""),
        difficulty: String(q.difficulty || "Medium"),
        intention: String(q.intention || ""),
        answer: String(answerText),
        modelAnswer: String(modelAnswerText),
      }
    })

  return {
    matchScore: Number(raw.matchScore),
    score: Number(raw.score || raw.readinessScore || raw.readiness || 0),
    title: String(raw.title || "Interview Preparation"),
    technicalQuestions: normalizeQuestions(raw.technicalQuestions),
    behaviouralQuestions: normalizeQuestions(behaviouralQuestions),
    skillGaps: (raw.skillGaps || []).slice(0, 8).map((gap) => ({
      skill: String(gap.skill || "Skill"),
      severity: normalizeSeverity(gap.severity),
    })),
    preparationPlan: (raw.preparationPlan || []).slice(0, 10),
  }
}

function stripCodeFence(text) {
  let jsonText = text.trim()
  if (jsonText.startsWith("```")) {
    jsonText = jsonText
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim()
  }
  return jsonText
}

function extractJsonCandidate(text) {
  const stripped = stripCodeFence(text)
  const start = stripped.indexOf("{")
  const end = stripped.lastIndexOf("}")
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("No JSON object found in AI response")
  }
  return stripped.slice(start, end + 1)
}

function repairJsonString(jsonText) {
  return jsonText.replace(/,\s*([\]}])/g, "$1")
}

function parseJsonSafely(text) {
  const candidate = extractJsonCandidate(text)
  const attempts = [candidate, repairJsonString(candidate)]

  let lastError
  for (const attempt of attempts) {
    try {
      return JSON.parse(attempt)
    } catch (err) {
      lastError = err
    }
  }

  throw new Error(`AI returned invalid JSON (${lastError?.message || "parse error"}). Please try again.`)
}

function buildPrompt({ resume, selfDescription, jobDescription, targetCompany, strict = false }) {
  const limits = `\nRules:\n- Return ONLY one valid JSON object. No markdown, no comments, no trailing commas.\n- Use double quotes for all strings. Escape newlines inside strings as spaces.\n- technicalQuestions: exactly 5 items\n- behaviouralQuestions: exactly 5 items\n- skillGaps: 3 to 5 items (severity: low, medium, or high only)\n- preparationPlan: exactly 5 days (day 1 through 5)\n- Keep each answer under 120 words.`

  const schema = `{
  "matchScore": <number 0-100>,
  "score": <number 0-100>,
  "title": "<job title>",
  "technicalQuestions": [{ "question": "", "difficulty": "Easy|Medium|Hard", "intention": "", "answer": "", "modelAnswer": "" }],
  "behaviouralQuestions": [{ "question": "", "difficulty": "Easy|Medium|Hard", "intention": "", "answer": "", "modelAnswer": "" }],
  "skillGaps": [{ "skill": "", "severity": "low|medium|high" }],
  "preparationPlan": [{ "day": 1, "focus": "", "tasks": ["", ""] }]
}`

  const strictNote = strict
    ? "\nIMPORTANT: Your previous response was invalid JSON. Fix and return ONLY valid JSON.\n"
    : ""

  const companyContext = targetCompany
    ? `Target company: ${targetCompany}. Adjust the blend of behavioral vs. technical questions and the question style to match ${targetCompany}. For example, if the company is Amazon, include leadership-principles-style behavioral questions.`
    : ""

  return `${strictNote}You are an expert interview coach. Generate an interview preparation report as JSON.\n\n${limits}\n\n${companyContext}\n\nSchema:\n${schema}\n\nResume:\n${truncate(resume, MAX_RESUME_CHARS)}\n\nSelf Description:\n${truncate(selfDescription, MAX_SELF_CHARS) || "Use the resume."}\n\nJob Description:\n${truncate(jobDescription, MAX_JOB_CHARS)}`
}

async function buildAtsScorePrompt({ resumeText, jobDescription, targetCompany }) {
  const companyContext = targetCompany
    ? `Target company: ${targetCompany}. Include the company-specific match when finding keywords and gaps.`
    : ''

  return `You are an expert resume coach.\n\nRules:\n- Return ONLY one valid JSON object. No markdown, no comments, no trailing commas.\n- Use double quotes for all strings.\n- Keep lists short and focused.\n\nSchema:\n{\n  "matchPercentage": <number 0-100>,\n  "matchedKeywords": [""],\n  "missingKeywords": [""]\n}\n\n${companyContext}\n\nResume Text:\n${truncate(resumeText, MAX_RESUME_CHARS)}\n\nJob Description:\n${truncate(jobDescription, MAX_JOB_CHARS)}`
}

async function buildDetailedAtsPrompt({ resumeText, jobDescription, targetCompany }) {
  const companyContext = targetCompany
    ? `Target company: ${targetCompany}. Include the company-specific match when finding keywords and gaps.`
    : ''

  return `You are an expert resume coach.\n\nRules:\n- Return ONLY one valid JSON object. No markdown, no comments, no trailing commas.\n- Use double quotes for all strings.\n\nSchema:\n{\n  "overallScore": <number 0-100>,\n  "breakdown": {\n    "keywordMatch": <number 0-100>,\n    "formatting": <number 0-100>,\n    "achievements": <number 0-100>,\n    "actionVerbs": <number 0-100>,\n    "sectionCompleteness": <number 0-100>\n  },\n  "missingKeywords": [""],\n  "suggestions": [""]\n}\n\n${companyContext}\n\nResume Text:\n${truncate(resumeText, MAX_RESUME_CHARS)}\n\nJob Description:\n${truncate(jobDescription, MAX_JOB_CHARS)}`
}

async function buildStarCheckPrompt({ questionText, userAnswer }) {
  return `You are an expert interview coach.\n\nEvaluate whether the provided answer follows the STAR framework: Situation, Task, Action, Result.\n- Return ONLY one valid JSON object.\n- Use true/false for the framework parts.\n- Provide a short improvementAdvice field.\n\nSchema:\n{\n  "situation": <true|false>,\n  "task": <true|false>,\n  "action": <true|false>,\n  "result": <true|false>,\n  "improvementAdvice": ""\n}\n\nQuestion:\n${questionText}\n\nAnswer:\n${userAnswer}`
}

async function getAtsResumeScore({ resumeText, jobDescription, targetCompany }) {
  if (!resumeText || !jobDescription) {
    throw new Error("resumeText and jobDescription are required for ATS scoring")
  }

  const prompt = await buildAtsScorePrompt({ resumeText, jobDescription, targetCompany })
  const text = await callGemini(prompt, { jsonMode: true })
  const parsed = parseJsonSafely(text)
  const validated = atsScoreSchema.safeParse(parsed)

  if (!validated.success) {
    console.error("ATS score validation failed:", validated.error.flatten())
    throw new Error("AI returned an invalid ATS score response. Please try again.")
  }

  return validated.data
}

async function getDetailedAtsScore({ resumeText, jobDescription, targetCompany }) {
  if (!resumeText || !jobDescription) {
    throw new Error('resumeText and jobDescription are required for ATS scoring')
  }

  const prompt = await buildDetailedAtsPrompt({ resumeText, jobDescription, targetCompany })
  const text = await callGemini(prompt, { jsonMode: true })
  const parsed = parseJsonSafely(text)
  const validated = detailedAtsSchema.safeParse(parsed)

  if (!validated.success) {
    console.error('Detailed ATS score validation failed:', validated.error.flatten())
    throw new Error('AI returned an invalid ATS score response. Please try again.')
  }

  return validated.data
}

async function getStarCheckFeedback({ questionText, userAnswer }) {
  if (!questionText || !userAnswer) {
    throw new Error("questionText and userAnswer are required for STAR checking")
  }

  const prompt = await buildStarCheckPrompt({ questionText, userAnswer })
  const text = await callGemini(prompt, { jsonMode: true })
  const parsed = parseJsonSafely(text)
  const validated = starCheckSchema.safeParse(parsed)

  if (!validated.success) {
    console.error("STAR check validation failed:", validated.error.flatten())
    throw new Error("AI returned an invalid STAR check response. Please try again.")
  }

  return validated.data
}

async function generateInterviewReport({
  resume,
  selfDescription,
  jobDescription,
  targetCompany,
}) {
  if (!process.env.GOOGLE_API_KEY) {
    throw new Error("GOOGLE_API_KEY is not configured")
  }

  let lastParseError

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const prompt = buildPrompt({
        resume,
        selfDescription,
        jobDescription,
        targetCompany,
        strict: attempt > 0,
      })

      const text = await callGemini(prompt, { jsonMode: true })
      const parsed = normalizeAiReport(parseJsonSafely(text))
      const validated = interviewReportSchema.safeParse(parsed)

      if (!validated.success) {
        console.error(
          "AI response validation failed:",
          validated.error.flatten()
        )
        throw new Error("AI returned an incomplete report. Please try again.")
      }

      return validated.data
    } catch (error) {
      lastParseError = error
      const isParseError =
        error.message?.includes("JSON") ||
        error.message?.includes("parse") ||
        error instanceof SyntaxError

      if (!isParseError || attempt === 1) {
        throw error
      }

      console.warn("JSON parse failed, retrying with strict prompt…")
    }
  }

  throw lastParseError || new Error("Failed to generate interview report")
}

module.exports = generateInterviewReport
module.exports.getAtsResumeScore = getAtsResumeScore
module.exports.getStarCheckFeedback = getStarCheckFeedback
module.exports.getDetailedAtsScore = getDetailedAtsScore
