const TIMEOUT_MS = 8000

async function checkGrammar({ text }) {
  if (!text?.trim()) {
    throw new Error("text is required for grammar checking")
  }

  const body = new URLSearchParams({
    text: text.trim(),
    language: "en-US",
  })

  const apiKey = process.env.LANGUAGETOOL_API_KEY || ""
  if (apiKey) {
    body.append("apiKey", apiKey)
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const res = await fetch("https://api.languagetool.org/v2/check", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
      signal: controller.signal,
    })

    if (!res.ok) {
      const text = await res.text().catch(() => "")
      throw new Error(`LanguageTool request failed (HTTP ${res.status}): ${text}`)
    }

    const result = await res.json()

    const issues = (result.matches || []).map((match) => ({
      message: match.message || "",
      shortSuggestion: match.replacements?.[0]?.value || null,
      offset: match.offset,
      length: match.length,
    }))

    return { issues }
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Grammar check timed out. Try again in a moment.")
    }
    throw error
  } finally {
    clearTimeout(timer)
  }
}

module.exports = { checkGrammar }
