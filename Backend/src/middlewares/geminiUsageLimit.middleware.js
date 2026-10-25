const geminiUsageModel = require("../models/geminiUsage.model")

function positiveInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

async function ensureDailyUsageRecord(userId, dayStart) {
  try {
    await geminiUsageModel.findOneAndUpdate(
      { _id: userId },
      {
        $setOnInsert: {
          dailyWindowStart: dayStart,
          dailyCount: 0,
          lastRequestAt: null,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: false },
    )
  } catch (error) {
    // Concurrent first requests can race to insert the same user's row.
    if (error.code !== 11000) throw error
  }

  // Reset only once per user when their UTC daily window changes.
  await geminiUsageModel.updateOne(
    { _id: userId, dailyWindowStart: { $ne: dayStart } },
    {
      $set: {
        dailyWindowStart: dayStart,
        dailyCount: 0,
        lastRequestAt: null,
      },
    },
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

    try {
      await ensureDailyUsageRecord(userId, dayStart)

      // The conditional update is atomic: concurrent requests cannot exceed
      // the daily cap or bypass the per-user cooldown.
      const usage = await geminiUsageModel.findOneAndUpdate(
        {
          _id: userId,
          dailyWindowStart: dayStart,
          dailyCount: { $lt: dailyLimit },
          $or: [
            { lastRequestAt: null },
            { lastRequestAt: { $lte: cooldownBefore } },
          ],
        },
        {
          $inc: { dailyCount: 1 },
          $set: { lastRequestAt: now },
        },
        { new: true },
      )

      if (usage) {
        res.set("RateLimit-Limit", String(dailyLimit))
        res.set("RateLimit-Remaining", String(Math.max(0, dailyLimit - usage.dailyCount)))
        res.set("RateLimit-Reset", String(Math.max(1, Math.ceil((dayEnd.getTime() - now.getTime()) / 1000))))
        return next()
      }

      const currentUsage = await geminiUsageModel.findById(userId).lean()
      if (!currentUsage) throw new Error("Gemini usage record is missing")

      const remaining = Math.max(0, dailyLimit - currentUsage.dailyCount)
      const resetSeconds = Math.max(1, Math.ceil((dayEnd.getTime() - now.getTime()) / 1000))
      const dailyLimitReached = currentUsage.dailyCount >= dailyLimit
      const cooldownEndsAt = currentUsage.lastRequestAt
        ? new Date(currentUsage.lastRequestAt.getTime() + cooldownMs)
        : now
      const retryAfterSeconds = dailyLimitReached
        ? resetSeconds
        : Math.max(1, Math.ceil((cooldownEndsAt.getTime() - now.getTime()) / 1000))

      res.set("RateLimit-Limit", String(dailyLimit))
      res.set("RateLimit-Remaining", String(remaining))
      res.set("RateLimit-Reset", String(resetSeconds))

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
    } catch (error) {
      console.error("Gemini usage limit error:", error)
      return res.status(503).json({
        message: "AI request limits are temporarily unavailable. Please try again shortly.",
      })
    }
  }
}

module.exports = createGeminiUsageLimit
