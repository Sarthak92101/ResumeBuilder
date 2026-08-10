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
}, { timestamps: true })

module.exports = mongoose.model('resume', resumeSchema)
