const API_BASE = "https://codeforces.com/api"
const TIMEOUT_MS = 12000
const MAX_RETRIES = 2

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchWithTimeout(url, options = {}, timeoutMs = TIMEOUT_MS) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

async function fetchCodeforcesSummary(handle) {
  const normalized = String(handle || "").trim()
  if (!normalized) {
    throw new Error("Codeforces handle is required")
  }

  let lastError

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const [infoRes, statusRes] = await Promise.all([
        fetchWithTimeout(`${API_BASE}/user.info?handles=${encodeURIComponent(normalized)}`),
        fetchWithTimeout(`${API_BASE}/user.status?handle=${encodeURIComponent(normalized)}&count=5000`),
      ])

      if (!infoRes.ok) {
        const infoBody = await infoRes.json().catch(() => ({}))
        const comment = infoBody?.comment || ""
        if (comment.includes("not found") || infoRes.status === 400) {
          throw new Error(`Codeforces user "${normalized}" not found`)
        }
        if (infoRes.status === 429) {
          throw new Error("Codeforces API rate limit reached. Try again later.")
        }
        throw new Error(`Codeforces API request failed (HTTP ${infoRes.status})`)
      }

      const infoBody = await infoRes.json()
      if (infoBody.status !== "OK") {
        throw new Error(infoBody?.comment || "Codeforces API returned an error")
      }

      const userInfo = infoBody.result?.[0]
      if (!userInfo) {
        throw new Error(`Codeforces user "${normalized}" not found`)
      }

      const statusBody = await statusRes.json().catch(() => null)
      const submissions = statusBody?.status === "OK" ? (statusBody.result || []) : []

      const solvedProblems = new Map()
      const tagCounts = {}

      for (const sub of submissions) {
        if (sub.verdict !== "OK") continue
        const problem = sub.problem
        if (!problem) continue

        const key = `${problem.contestId}-${problem.index}`
        if (solvedProblems.has(key)) continue

        solvedProblems.set(key, true)

        for (const tag of (problem.tags || [])) {
          if (!tag) continue
          const normalTag = String(tag).trim()
          tagCounts[normalTag] = (tagCounts[normalTag] || 0) + 1
        }
      }

      const tagWise = Object.entries(tagCounts)
        .map(([tag, solved]) => ({ tag, solved }))
        .sort((a, b) => b.solved - a.solved)

      return {
        handle: normalized,
        rating: Number(userInfo.rating || 0),
        maxRating: Number(userInfo.maxRating || 0),
        rank: String(userInfo.rank || ""),
        totalSolved: solvedProblems.size,
        tagWise,
        fetchedAt: new Date().toISOString(),
      }
    } catch (error) {
      lastError = error
      if (error.name === "AbortError") {
        lastError = new Error(`Fetching Codeforces profile for "${normalized}" timed out`)
      }
      if (attempt < MAX_RETRIES - 1) {
        await sleep(700 * (attempt + 1))
      }
    }
  }

  throw lastError || new Error(`Couldn't fetch Codeforces data for "${normalized}"`)
}

module.exports = { fetchCodeforcesSummary }
