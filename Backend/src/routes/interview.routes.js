const express = require("express")
const authMiddleware = require("../middlewares/auth.middleware")
const createGeminiUsageLimit = require("../middlewares/geminiUsageLimit.middleware")
const geminiUsageLimit = createGeminiUsageLimit()
const interviewController = require("../controllers/interview.controller")
const upload = require("../middlewares/file.middleware")

const interviewRouter = express.Router()

const uploadResume = (req, res, next) => {
  upload.single("resume")(req, res, (err) => {
    if (!err) {
      return next()
    }

    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: "File size exceeds 5MB limit" })
    }

    return res.status(400).json({
      message: err.message || "File upload failed",
    })
  })
}

interviewRouter.post(
  "/",
  authMiddleware.authUser,
  geminiUsageLimit,
  uploadResume,
  interviewController.generateInterviewReportController
)

interviewRouter.post(
  "/ats-score",
  authMiddleware.authUser,
  geminiUsageLimit,
  interviewController.atsScoreController
)

interviewRouter.post(
  "/star-check",
  authMiddleware.authUser,
  geminiUsageLimit,
  interviewController.starCheckController
)

interviewRouter.post(
  "/report/:interviewId/proof-claims/:claimId/check",
  authMiddleware.authUser,
  geminiUsageLimit,
  interviewController.checkProofClaimController
)

interviewRouter.get(
  "/report/:interviewId/pdf",
  authMiddleware.authUser,
  interviewController.downloadInterviewReportPdfController
)

interviewRouter.get(
  "/report/:interviewId",
  authMiddleware.authUser,
  interviewController.getInterviewReportByIdController
)

interviewRouter.get(
  "/",
  authMiddleware.authUser,
  interviewController.getAllInterviewReportController
)

interviewRouter.get(
  "/stats",
  authMiddleware.authUser,
  interviewController.getInterviewStatsController
)

// ── Feature 1: Voice Feedback ─────────────────────────────────────────────────
interviewRouter.post(
  "/voice-feedback",
  authMiddleware.authUser,
  geminiUsageLimit,
  interviewController.voiceFeedbackController
)

// ── Separate CV-based avatar interview (text answers; voice mock stays separate) ──
interviewRouter.post(
  "/avatar-interview",
  authMiddleware.authUser,
  interviewController.avatarInterviewController
)

interviewRouter.post(
  "/avatar-interview/resume-insights",
  authMiddleware.authUser,
  interviewController.avatarResumeInsightsController
)

// ── Feature 2: Gap Analysis ───────────────────────────────────────────────────
interviewRouter.post(
  "/gap-analysis",
  authMiddleware.authUser,
  geminiUsageLimit,
  interviewController.gapAnalysisController
)

// ── Feature 3: Adaptive Next Question ─────────────────────────────────────────
interviewRouter.post(
  "/next-question",
  authMiddleware.authUser,
  geminiUsageLimit,
  interviewController.nextQuestionController
)

// ── Live Code Execution (Judge0) ──────────────────────────────────────────────
interviewRouter.post(
  "/run-code",
  authMiddleware.authUser,
  interviewController.runCodeController
)

// ── Grammar Check (LanguageTool) ──────────────────────────────────────────────
interviewRouter.post(
  "/grammar-check",
  authMiddleware.authUser,
  interviewController.grammarCheckController
)

// ── Feature 4: Mentor Share Link (public, no auth) ────────────────────────────
interviewRouter.get(
  "/shared/:shareToken",
  interviewController.getSharedReportController
)

interviewRouter.post(
  "/shared/:shareToken/comment",
  interviewController.addMentorCommentController
)

// ── Feature 4: Share link generation (auth required) ──────────────────────────
interviewRouter.post(
  "/report/:interviewId/share",
  authMiddleware.authUser,
  interviewController.shareReportController
)

module.exports = interviewRouter
