const express = require("express")
const authMiddleware = require("../middlewares/auth.middleware")
const integrationController = require("../controllers/integration.controller")

const integrationRouter = express.Router()

integrationRouter.get(
  "/github/:username",
  authMiddleware.authUser,
  integrationController.getGitHubProfileController
)

integrationRouter.get(
  "/leetcode/:username",
  authMiddleware.authUser,
  integrationController.getLeetCodeProfileController
)

module.exports = integrationRouter