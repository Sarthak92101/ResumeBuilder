const GITHUB_API = "https://api.github.com"
const RAW_CONTENT_API = "https://raw.githubusercontent.com"
const TIMEOUT_MS = 8000
const README_TIMEOUT_MS = 5000
const REPO_LIMIT = 6
const README_MAX_CHARS = 600

async function fetchWithTimeout(url, options = {}, timeoutMs = TIMEOUT_MS) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

function githubHeaders() {
  const headers = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "SkillMirror",
  }
  const token = process.env.GITHUB_TOKEN
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  return headers
}

function friendlyGitHubError(res, username) {
  if (res.status === 404) {
    return new Error(`GitHub user "${username}" not found`)
  }
  if (res.status === 403 || res.status === 429) {
    return new Error("GitHub API rate limit reached. Try again later, or add a GITHUB_TOKEN to Backend/.env to raise the limit.")
  }
  return new Error(`GitHub API request failed (HTTP ${res.status}) for "${username}"`)
}

function stripMarkdown(text) {
  return String(text || "")
    .replace(/```[a-z]*\s*[\s\S]*?```/gi, " ")
    .replace(/[#>*_`~|[\]]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function summarizeReadme(text) {
  const cleaned = stripMarkdown(text)
  if (!cleaned) return ""
  return cleaned.length <= README_MAX_CHARS ? cleaned : `${cleaned.slice(0, README_MAX_CHARS)}…`
}

async function fetchReadme(owner, repo, defaultBranch) {
  const branch = defaultBranch || "main"
  const url = `${RAW_CONTENT_API}/${owner}/${repo}/${branch}/README.md`
  try {
    const res = await fetchWithTimeout(url, { headers: { "User-Agent": "SkillMirror" } }, README_TIMEOUT_MS)
    if (!res.ok) return ""
    const text = await res.text()
    return summarizeReadme(text)
  } catch (error) {
    console.warn(`Could not fetch README for ${owner}/${repo}:`, error.message)
    return ""
  }
}

async function fetchGitHubSummary(username) {
  const normalized = String(username || "").trim()
  if (!normalized) {
    throw new Error("GitHub username is required")
  }

  let reposRes
  try {
    reposRes = await fetchWithTimeout(`${GITHUB_API}/users/${encodeURIComponent(normalized)}/repos?sort=updated&per_page=${REPO_LIMIT}`, {
      headers: githubHeaders(),
    })
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error(`Fetching GitHub profile for "${normalized}" timed out`)
    }
    throw new Error(`Couldn't fetch GitHub data for "${normalized}" (network error: ${error.message})`)
  }

  if (!reposRes.ok) {
    throw friendlyGitHubError(reposRes, normalized)
  }

  let repos
  try {
    repos = await reposRes.json()
  } catch (error) {
    throw new Error(`GitHub API returned an invalid response for "${normalized}"`)
  }

  const readmeResults = await Promise.allSettled(
    repos.map((repo) => fetchReadme(repo.owner?.login || normalized, repo.name, repo.default_branch))
  )

  const reposSummary = (repos || []).slice(0, REPO_LIMIT).map((repo, index) => {
    const readmeSummary =
      readmeResults[index]?.status === "fulfilled" ? readmeResults[index].value : ""
    return {
      name: String(repo.name || "untitled"),
      description: String(repo.description || ""),
      language: String(repo.language || ""),
      stars: Number(repo.stargazers_count || 0),
      url: String(repo.html_url || ""),
      readmeSummary,
    }
  })

  return {
    username: normalized,
    repos: reposSummary,
    fetchedAt: new Date().toISOString(),
  }
}

module.exports = { fetchGitHubSummary }