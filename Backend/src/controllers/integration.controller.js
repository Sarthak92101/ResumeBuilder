const { fetchGitHubSummary } = require("../services/github.service")
const { fetchLeetCodeSummary } = require("../services/leetcode.service")
const { fetchCodeforcesSummary } = require("../services/codeforces.service")

async function getGitHubProfileController(req, res) {
  try {
    const username = String(req.params.username || "").trim()
    if (!username) {
      return res.status(400).json({ success: false, message: "GitHub username is required" })
    }

    const summary = await fetchGitHubSummary(username)
    res.status(200).json({ success: true, summary })
  } catch (error) {
    console.error("Fetch GitHub profile error:", error.message)
    res.status(200).json({ success: false, message: error.message || "Couldn't fetch GitHub data" })
  }
}

async function getLeetCodeProfileController(req, res) {
  try {
    const username = String(req.params.username || "").trim()
    if (!username) {
      return res.status(400).json({ success: false, message: "LeetCode username is required" })
    }

    const summary = await fetchLeetCodeSummary(username)
    res.status(200).json({ success: true, summary })
  } catch (error) {
    console.error("Fetch LeetCode profile error:", error.message)
    res.status(200).json({ success: false, message: error.message || "Couldn't fetch LeetCode data" })
  }
}

async function getCodeforcesProfileController(req, res) {
  try {
    const handle = String(req.params.handle || "").trim()
    if (!handle) {
      return res.status(400).json({ success: false, message: "Codeforces handle is required" })
    }

    const summary = await fetchCodeforcesSummary(handle)
    res.status(200).json({ success: true, summary })
  } catch (error) {
    console.error("Fetch Codeforces profile error:", error.message)
    res.status(200).json({ success: false, message: error.message || "Couldn't fetch Codeforces data" })
  }
}

module.exports = {
  getGitHubProfileController,
  getLeetCodeProfileController,
  getCodeforcesProfileController,
}