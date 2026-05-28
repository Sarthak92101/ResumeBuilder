const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const interviewController = require('../controllers/interview.controller');
const upload=require("../middlewares/file.middleware")

const interviewRouter = express.Router();
const router = express.Router();  

/**
 * @Route POST /api/interview/
 * @description  generate new interview report on the basis of resume and job description
 * @access private
 */
interviewRouter.post("/",authMiddleware.authUser,upload.single("resume"),interviewController.generateInterviewReportController)

module.exports = interviewRouter;