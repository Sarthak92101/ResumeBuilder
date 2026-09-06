const LEETCODE_GRAPHQL = "https://leetcode.com/graphql"
const TIMEOUT_MS = 10000
const MAX_RETRIES = 2
const TOP_TOPICS = 5

const PROFILE_QUERY = `
query userPublicProfile($username: String!) {
  matchedUser(username: $username) {
    username
    submitStats: submitStatsGlobal {
      acSubmissionNum {
        difficulty
        count
      }
    }
    tagProblemCounts {
      advanced { tagName tagSlug problemsSolved }
      intermediate { tagName tagSlug problemsSolved }
      fundamental { tagName tagSlug problemsSolved }
    }
  }
}
`

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

function extractSubmitStats(submitStats) {
  const byDifficulty = {}
  for (const entry of (submitStats?.acSubmissionNum || [])) {
    byDifficulty[entry.difficulty] = Number(entry.count || 0)
  }
  const easy = byDifficulty["Easy"] || 0
  const medium = byDifficulty["Medium"] || 0
  const hard = byDifficulty["Hard"] || 0
  return { easy, medium, hard, totalSolved: easy + medium + hard }
}

function extractTopTopics(tagProblemCounts) {
  const merged = new Map()
  for (const group of ["advanced", "intermediate", "fundamental"]) {
    for (const item of (tagProblemCounts?.[group] || [])) {
      const slug = String(item.tagSlug || "")
      const tag = String(item.tagName || slug || "Unknown")
      if (!slug) continue
      const existing = merged.get(slug)
      if (existing) {
        existing.solved += Number(item.problemsSolved || 0)
      } else {
        merged.set(slug, { tag, solved: Number(item.problemsSolved || 0) })
      }
    }
  }
  return Array.from(merged.values())
    .sort((a, b) => b.solved - a.solved)
    .slice(0, TOP_TOPICS)
    .filter((topic) => topic.solved > 0)
}

async function fetchLeetCodeSummary(username) {
  const normalized = String(username || "").trim()
  if (!normalized) {
    throw new Error("LeetCode username is required")
  }

  let lastError

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const res = await fetchWithTimeout(LEETCODE_GRAPHQL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Referer: "https://leetcode.com/",
          "User-Agent": "SkillMirror",
        },
        body: JSON.stringify({
          query: PROFILE_QUERY,
          variables: { username: normalized },
        }),
      })

      if (!res.ok) {
        lastError = new Error(`LeetCode API request failed (HTTP ${res.status}) for "${normalized}"`)
        continue
      }

      const payload = await res.json()
      const errors = payload?.errors?.[0]?.message
      if (errors) {
        lastError = new Error(`LeetCode API error: ${errors}`)
        continue
      }

      const matchedUser = payload?.data?.matchedUser

      if (!matchedUser) {
        throw new Error(`LeetCode user "${normalized}" not found`)
      }

      const { easy, medium, hard, totalSolved } = extractSubmitStats(matchedUser.submitStats)
      const topTopics = extractTopTopics(matchedUser.tagProblemCounts)

      return {
        username: normalized,
        totalSolved,
        easy,
        medium,
        hard,
        topTopics,
        fetchedAt: new Date().toISOString(),
      }
    } catch (error) {
      lastError = error
      if (error.name === "AbortError") {
        lastError = new Error(`Fetching LeetCode profile for "${normalized}" timed out`)
      }
      if (attempt < MAX_RETRIES - 1) {
        await sleep(700 * (attempt + 1))
      }
    }
  }

  throw lastError || new Error(`Couldn't fetch LeetCode data for "${normalized}"`)
}

module.exports = { fetchLeetCodeSummary }