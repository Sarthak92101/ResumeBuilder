const mongoose = require("mongoose")

const geminiUsageSchema = new mongoose.Schema({
  dailyWindowStart: { type: Date, required: true },
  dailyCount: { type: Number, required: true, default: 0 },
  lastRequestAt: { type: Date, default: null },
  lastRequestId: { type: String, default: null },
}, {
  versionKey: false,
})

// _id is the authenticated user's id, so MongoDB's built-in _id index keeps
// one atomic usage record per user without needing a separate index setup.
module.exports = mongoose.model("geminiUsage", geminiUsageSchema)
