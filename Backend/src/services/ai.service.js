const { GoogleGenAI } = require("@google/genai")
const { z } = require("zod")

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY,
})

const DEFAULT_MODELS = [
  process.env.GEMINI_MODEL,
  "gemini-3-pro-preview",
  "gemini-3-flash-preview",
  "gemini-2.5-pro",
  "gemini-2.5-flash",
].filter(Boolean)

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
    const message = apiError?.message || raw

    if (code === 429 || apiError?.status === "RESOURCE_EXHAUSTED") {
      return new Error(
        "Gemini API quota exceeded. Wait a few minutes, try again later, or use a new API key from https://aistudio.google.com/apikey"
      )
    }

    if (code === 401 || code === 403) {
      return new Error(
        "Invalid or unauthorized Gemini API key. Check GOOGLE_API_KEY in Backend/.env"
      )
    }

    return new Error(message)
  } catch {
    if (raw.includes("quota") || raw.includes("RESOURCE_EXHAUSTED")) {
      return new Error(
        "Gemini API quota exceeded. Wait a few minutes or create a new API key at https://aistudio.google.com/apikey"
      )
    }
    return new Error(raw)
  }
}

async function callGemini(prompt, { jsonMode = true } = {}) {
  const models = DEFAULT_MODELS.length ? DEFAULT_MODELS : ["gemini-2.5-flash"]
  let lastError

  for (const model of models) {
    try {
      console.log(`Calling Gemini API with model: ${model}`)
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: jsonMode
          ? {
              responseMimeType: "application/json",
            }
          : undefined,
      })

      const text =
        response.text ||
        response.candidates?.[0]?.content?.parts?.[0]?.text

      if (!text) {
        throw new Error("Empty response from AI service")
      }

      return text
    } catch (error) {
      lastError = parseGeminiError(error)
      const isQuota =
        lastError.message.includes("quota") ||
        lastError.message.includes("RESOURCE_EXHAUSTED")

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
  const behaviouralQuestions =
    raw.behaviouralQuestions ?? raw.behavioralQuestions ?? []

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
  const attempts = [
    candidate,
    repairJsonString(candidate),
  ]

  let lastError
  for (const attempt of attempts) {
    try {
      return JSON.parse(attempt)
    } catch (err) {
      lastError = err
    }
  }

  throw new Error(
    `AI returned invalid JSON (${lastError?.message || "parse error"}). Please try again.`
  )
}

function buildPrompt({ resume, selfDescription, jobDescription, targetCompany, strict = false }) {
  const limits = `
Rules:
- Return ONLY one valid JSON object. No markdown, no comments, no trailing commas.
- Use double quotes for all strings. Escape newlines inside strings as spaces.
- technicalQuestions: exactly 5 items
- behaviouralQuestions: exactly 5 items
- skillGaps: 3 to 5 items (severity: low, medium, or high only)
- preparationPlan: exactly 5 days (day 1 through 5)
- Keep each answer under 120 words.`

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

  return `${strictNote}You are an expert interview coach. Generate an interview preparation report as JSON.

${limits}

${companyContext}

Schema:
${schema}

Resume:
${truncate(resume, MAX_RESUME_CHARS)}

Self Description:
${truncate(selfDescription, MAX_SELF_CHARS) || "Use the resume."}

Job Description:
${truncate(jobDescription, MAX_JOB_CHARS)}`
}

async function buildAtsScorePrompt({ resumeText, jobDescription, targetCompany }) {
  const companyContext = targetCompany
    ? `Target company: ${targetCompany}. Include the company-specific match when finding keywords and gaps.`
    : ""

  return `You are an expert resume coach.

Rules:
- Return ONLY one valid JSON object. No markdown, no comments, no trailing commas.
- Use double quotes for all strings.
- Keep lists short and focused.

Schema:
{
  "matchPercentage": <number 0-100>,
  "matchedKeywords": [""],
  "missingKeywords": [""]
}

${companyContext}

Resume Text:
${truncate(resumeText, MAX_RESUME_CHARS)}

Job Description:
${truncate(jobDescription, MAX_JOB_CHARS)}`
}

async function buildStarCheckPrompt({ questionText, userAnswer }) {
  return `You are an expert interview coach.

Evaluate whether the provided answer follows the STAR framework: Situation, Task, Action, Result.
- Return ONLY one valid JSON object.
- Use true/false for the framework parts.
- Provide a short improvementAdvice field.

Schema:
{
  "situation": <true|false>,
  "task": <true|false>,
  "action": <true|false>,
  "result": <true|false>,
  "improvementAdvice": ""
}

Question:
${questionText}

Answer:
${userAnswer}`
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
