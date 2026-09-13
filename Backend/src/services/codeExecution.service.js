const JUDGE0_LANGUAGES = {
  javascript: 63,
  python: 71,
  java: 62,
}

const TIMEOUT_MS = 10000

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function getJudge0Config() {
  const apiKey = process.env.JUDGE0_API_KEY || ""
  const baseUrl = (
    process.env.JUDGE0_API_URL || "https://judge0-ce.p.rapidapi.com"
  ).replace(/\/+$/, "")

  return { apiKey, baseUrl }
}

function toBase64(str) {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(String(str || ""), "utf-8").toString("base64")
  }
  return btoa(String(str || ""))
}

function fromBase64(b64) {
  if (!b64) return ""
  try {
    if (typeof Buffer !== "undefined") {
      return Buffer.from(b64, "base64").toString("utf-8")
    }
    return atob(b64)
  } catch {
    return ""
  }
}

async function submitToJudge0({ code, language, stdin, timeoutMs }) {
  const { apiKey, baseUrl } = getJudge0Config()

  if (!apiKey) {
    const err = new Error(
      "Code execution isn't configured right now. Couldn't run code right now, try again."
    )
    err.code = "JUDGE0_NOT_CONFIGURED"
    throw err
  }

  const langId = JUDGE0_LANGUAGES[language]
  if (!langId) {
    throw new Error(`Unsupported language: ${language}. Use javascript, python, or java.`)
  }

  const body = JSON.stringify({
    source_code: toBase64(code),
    language_id: langId,
    stdin: toBase64(stdin || ""),
  })

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs || TIMEOUT_MS)

  try {
    const res = await fetch(`${baseUrl}/submissions?base64_encoded=true&wait=true`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-RapidAPI-Key": apiKey,
        "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
      },
      body,
      signal: controller.signal,
    })

    if (res.status === 429) {
      throw new Error("Code execution rate limit reached. Try again in a moment.")
    }

    if (!res.ok) {
      const text = await res.text().catch(() => "")
      throw new Error(`Judge0 request failed (HTTP ${res.status}): ${text}`)
    }

    const result = await res.json()
    return result
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Code execution timed out. The code may be too slow or caught in a loop.")
    }
    throw error
  } finally {
    clearTimeout(timer)
  }
}

function normalizeOutput(stdout) {
  return fromBase64(stdout).trim()
}

async function runCodeAgainstTestCases({ code, language, testCases }) {
  if (!code?.trim()) throw new Error("code is required")
  if (!language) throw new Error("language is required")
  if (!Array.isArray(testCases) || !testCases.length) {
    throw new Error("No test cases available for this question")
  }

  const langId = JUDGE0_LANGUAGES[language]
  if (!langId) {
    throw new Error(`Unsupported language: ${language}. Use javascript, python, or java.`)
  }

  const results = []

  for (const tc of testCases) {
    try {
      const result = await submitToJudge0({
        code,
        language,
        stdin: tc.input || "",
      })

      const actual = normalizeOutput(result.stdout || "")
      const expected = String(tc.expectedOutput || "").trim()

      results.push({
        input: tc.input || "",
        expectedOutput: expected,
        output: actual,
        pass: actual === expected,
        statusId: result.status?.id || null,
        time: result.time || null,
        memory: result.memory || null,
        compileOutput: fromBase64(result.compile_output || ""),
        stderr: fromBase64(result.stderr || ""),
      })
    } catch (error) {
      results.push({
        input: tc.input || "",
        expectedOutput: String(tc.expectedOutput || "").trim(),
        output: "",
        pass: false,
        error: error.message || "Execution failed",
      })
    }
  }

  return {
    results,
    executedAt: new Date().toISOString(),
  }
}

module.exports = { runCodeAgainstTestCases, JUDGE0_LANGUAGES }
