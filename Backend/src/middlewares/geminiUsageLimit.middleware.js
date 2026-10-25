const crypto = require("node:crypto")
const geminiUsageModel = require("../models/geminiUsage.model")

function positiveInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function getUsagePipeline({ dayStart, cooldownBefore, now, requestId, dailyLimit }) {
  return [
    {
      $set: {
        dailyWindowStart: { $literal: dayStart },
        dailyCount: {
          $cond: [
            { $eq: ["$dailyWindowStart", { $literal: dayStart }] },
            { $ifNull: ["$dailyCount", 0] },
            0,
          ],
        },
        lastRequestAt: { $ifNull: ["$lastRequestAt", null] },
      },
    },
    {
      $set: {
        _requestAllowed: {
          $and: [
            { $lt: ["$dailyCount", dailyLimit] },
            {
              $or: [
                { $eq: ["$lastRequestAt", null] },
                { $lte: ["$lastRequestAt", { $literal: cooldownBefore }] },
              ],
            },
          ],
        },
      },
    },
    {
      $set: {
        dailyCount: {
          $cond: ["$_requestAllowed", { $add: ["$dailyCount", 1] }, "$dailyCount"],
        },
        lastRequestAt: {
          $cond: ["$_requestAllowed", { $literal: now }, "$lastRequestAt"],
        },
        lastRequestId: {
          $cond: ["$_requestAllowed", { $literal: requestId }, { $ifNull: ["$lastRequestId", null] }],
        },
      },
    },
    { $unset: "_requestAllowed" },
  ]
}

async function reserveUsage(userId, pipeline, upsert) {
  return geminiUsageModel.findOneAndUpdate(
    { _id: userId },
    pipeline,
    { new: true, upsert, setDefaultsOnInsert: false },
  )
}

function createGeminiUsageLimit({ allowLocalAtsFallback = false } = {}) {
  return async function geminiUsageLimit(req, res, next) {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" })
    }

    const dailyLimit = positiveInteger(process.env.GEMINI_USER_DAILY_LIMIT, 20)
    const cooldownMs = positiveInteger(process.env.GEMINI_USER_COOLDOWN_MS, 10000)
    const now = new Date()
    const dayStart = new Date(now)
    dayStart.setUTCHours(0, 0, 0, 0)
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)
    const cooldownBefore = new Date(now.getTime() - cooldownMs)
    const requestId = crypto.randomUUID()
    const pipeline = getUsagePipeline({ dayStart, cooldownBefore, now, requestId, dailyLimit })

    try {
      let usage
      try {
        usage = await reserveUsage(userId, pipeline, true)
      } catch (error) {
        // Two first-time requests can race to create the user's usage row.
        // Retry against the row created by the winner of that race.
        if (error.code !== 11000) throw error
        usage = await reserveUsage(userId, pipeline, false)
      }

      if (!usage) throw new Error("Could not reserve Gemini usage")

      const remaining = Math.max(0, dailyLimit - usage.dailyCount)
      const resetSeconds = Math.max(1, Math.ceil((dayEnd.getTime() - now.getTime()) / 1000))
      res.set("RateLimit-Limit", String(dailyLimit))
      res.set("RateLimit-Remaining", String(remaining))
      res.set("RateLimit-Reset", String(resetSeconds))

      if (usage.lastRequestId !== requestId) {
        const dailyLimitReached = usage.dailyCount >= dailyLimit
        const cooldownEndsAt = usage.lastRequestAt
          ? new Date(usage.lastRequestAt.getTime() + cooldownMs)
          : now
        const retryAfterSeconds = dailyLimitReached
          ? resetSeconds
          : Math.max(1, Math.ceil((cooldownEndsAt.getTime() - now.getTime()) / 1000))

        if (allowLocalAtsFallback) {
          req.geminiLimitReached = true
          return next()
        }

        res.set("Retry-After", String(retryAfterSeconds))
        return res.status(429).json({
          code: dailyLimitReached ? "GEMINI_DAILY_LIMIT" : "GEMINI_COOLDOWN",
          message: dailyLimitReached
            ? "You have reached today's AI request limit. Please try again after the daily reset."
            : "Please wait a few seconds before starting another AI request.",
          limit: dailyLimit,
          remaining,
          resetAt: dayEnd.toISOString(),
          retryAfterSeconds,
        })
      }

      return next()
    } catch (error) {
      console.error("Gemini usage limit error:", error.message)
      return res.status(503).json({
        message: "AI request limits are temporarily unavailable. Please try again shortly.",
      })
    }
  }
}

module.exports = createGeminiUsageLimit
