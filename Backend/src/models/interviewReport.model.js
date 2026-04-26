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

const technicalQuestionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: [true, "Question is required"]
  },
  intention: {
    type: String,
    required: [true, "Intention is required"]
  },
  answer: {
    type: String,
    required: [true, "Answer is required"]
  },

}, {
  _id: false
})


const BehaviouralQuestionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: [true, "Question is required"]
  },
  intention: {
    type: String,
    required: [true, "Intention is required"]
  },
  answer: {
    type: String,
    required: [true, "Answer is required"]
  },

}, {
  _id: false
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
  matchScore: {
    type: Number,
    min: 0,
    max: 100
  },
  technicalQuestions: [technicalQuestionSchema],
  behaviouralQuestions: [BehaviouralQuestionSchema],
  skillGaps: [skillGapSchema],
  preparationPlan: [preparationPlanSchema]
}, {
  timestamps: true
})

const interviewReportModel = mongoose.model("interviewReport", interviewRepostSchema)
module.exports = mongoose.model("interviewReport", interviewReportSchema)