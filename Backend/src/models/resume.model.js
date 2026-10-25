const mongoose = require('mongoose')

const resumeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true,
  },
  fileName: { type: String, required: true },
  uploadedAt: { type: Date, default: () => new Date() },
  extractedText: { type: String },
  confirmedInterviewAchievements: {
    type: [{
      text: { type: String, required: true, trim: true, maxlength: 500 },
      sourceAnswer: { type: String, trim: true, maxlength: 1800 },
      confirmedAt: { type: Date, default: () => new Date() },
    }],
    default: [],
  },
}, { timestamps: true })

module.exports = mongoose.model('resume', resumeSchema)
