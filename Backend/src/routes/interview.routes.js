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

module.exports = interviewRouter
