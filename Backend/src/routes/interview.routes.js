const express = require("express")
const authMiddleware = require("../middlewares/auth.middleware")
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
  uploadResume,
  interviewController.generateInterviewReportController
)

interviewRouter.post(
  "/ats-score",
  authMiddleware.authUser,
  interviewController.atsScoreController
)

interviewRouter.post(
  "/star-check",
  authMiddleware.authUser,
  interviewController.starCheckController
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
  interviewController.voiceFeedbackController
)

// ── Feature 2: Gap Analysis ───────────────────────────────────────────────────
interviewRouter.post(
  "/gap-analysis",
  authMiddleware.authUser,
  interviewController.gapAnalysisController
)

// ── Feature 3: Adaptive Next Question ─────────────────────────────────────────
interviewRouter.post(
  "/next-question",
  authMiddleware.authUser,
  interviewController.nextQuestionController
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
