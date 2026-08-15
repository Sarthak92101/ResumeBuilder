const mongoose = require('mongoose')

const atsSchema = new mongoose.Schema({
  resume: { type: mongoose.Schema.Types.ObjectId, ref: 'resume', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
  overallScore: { type: Number, required: true },
  breakdown: {
    keywordMatch: { type: Number },
    formatting: { type: Number },
    achievements: { type: Number },
    actionVerbs: { type: Number },
    sectionCompleteness: { type: Number },
  },
  missingKeywords: { type: [String], default: [] },
  suggestions: { type: [String], default: [] },
  rawResponse: { type: Object },
}, { timestamps: true })

module.exports = mongoose.model('atsScore', atsSchema)
