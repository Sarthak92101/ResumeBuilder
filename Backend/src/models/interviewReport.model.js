const mongoose = require("mongoose");

/**
 * By user
 * job decsription schema:String
 * resume text:String
 * self decsription:String
 * 
 * By AI
 * matchScore :Number
 * Technical questions : [{
 *                         question:"",
 *                         answer:"",
 *                         intention:""
 *                       }]
 * Behavioural questions : [{
 *                         question:"",
 *                         answer:"",
 *                         intention:""
 *                         }]
 * skill gaps : [{
 *                skill:"",
 *                Severity:{
 *                type:String,
 *                 enum;["low","medium","high"]}
 *               }]
 * preparation plan : [{
 *                     day:Number,
 *                     focus: String,
 *                     tasks:[String]
 *                    }]
 */

const testCaseSchema = new mongoose.Schema({
  input: { type: String },
  expectedOutput: { type: String },
}, {
  _id: false,
})

const technicalQuestionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: [true, "Question is required"]
  },
  difficulty: {
    type: String,
    enum: ["Easy", "Medium", "Hard"],
    default: "Medium",
  },
  intention: {
    type: String,
    required: [true, "Intention is required"]
  },
  answer: {
    type: String,
    required: [true, "Answer is required"]
  },
  isCoding: {
    type: Boolean,
    default: false,
  },
  testCases: {
    type: [testCaseSchema],
    default: [],
  },

})


const BehaviouralQuestionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: [true, "Question is required"]
  },
  difficulty: {
    type: String,
    enum: ["Easy", "Medium", "Hard"],
    default: "Medium",
  },
  intention: {
    type: String,
    required: [true, "Intention is required"]
  },
  answer: {
    type: String,
    required: [true, "Answer is required"]
  },

})

const skillGapSchema = new mongoose.Schema({
  skill: {
    type: String,
    required: [true, "Skill is required"]
  },
  severity: {
    type: String,
    enum: ["low", "medium", "high"],
    required: [true, "Severity is required"]
  }
}, {
  _id: false
})

const preparationPlanSchema = new mongoose.Schema({
  day: {
    type: Number,
    required: [true, "Day is required"]
  },
  focus: {
    type: String,
    required: [true, "Focus is required"]
  },
  tasks: {
    type: [String],
    required: [true, "Tasks are required"]
  }
}, {
  _id: false
})

const proofAttemptSchema = new mongoose.Schema({
  answer: { type: String, required: true, maxlength: 4000 },
  evidenceNote: { type: String, default: "", maxlength: 1500 },
  evidenceUrl: { type: String, default: "", maxlength: 500 },
  status: {
    type: String,
    enum: ["clear_explanation", "needs_detail"],
    required: true,
  },
  summary: { type: String, required: true, maxlength: 1200 },
  strengths: { type: [String], default: [] },
  missingDetails: { type: [String], default: [] },
  nextQuestion: { type: String, default: "", maxlength: 1000 },
}, { timestamps: true })

const proofClaimSchema = new mongoose.Schema({
  claim: { type: String, required: true, maxlength: 500 },
  sourceText: { type: String, default: "", maxlength: 700 },
  skill: { type: String, required: true, maxlength: 100 },
  challengeQuestion: { type: String, required: true, maxlength: 500 },
  attempts: { type: [proofAttemptSchema], default: [] },
})

const mentorCommentSchema = new mongoose.Schema({
  author: { type: String, default: "Anonymous Mentor" },
  text: { type: String, required: true },
}, { _id: true, timestamps: true })

const interviewReportSchema = new mongoose.Schema({
  jobDescription: {
    type: String,
    required: [true, "Job description is required"]
  },
  resume: {
    type: String
  },
  selfDescription: {
    type: String
  },
  targetCompany: {
    type: String,
    trim: true,
  },
  interviewDate: {
    type: Date,
  },
  reminderSentAt: {
    type: Date,
  },
  matchScore: {
    type: Number,
    min: 0,
    max: 100
  },
  score: {
    type: Number,
    min: 0,
    max: 100,
  },
  technicalQuestions: [technicalQuestionSchema],
  behaviouralQuestions: [BehaviouralQuestionSchema],
  skillGaps: [skillGapSchema],
  preparationPlan: [preparationPlanSchema],
  proofClaims: { type: [proofClaimSchema], default: [] },
  user:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"user",
  },
  resumeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "resume",
    default: null,
  },
  title: {
    type: String,
    required: [true, "Title is required"]
  },
  language: {
    type: String,
    enum: ["en", "hi", "hinglish"],
    default: "en",
  },
  shareToken: {
    type: String,
    unique: true,
    sparse: true,
  },
  mentorComments: [mentorCommentSchema],
  githubSummary: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  leetcodeSummary: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  codeforcesSummary: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
}, {
  timestamps: true
})

module.exports = mongoose.model("interviewReport", interviewReportSchema)
