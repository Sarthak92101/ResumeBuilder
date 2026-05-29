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

/**
 * @Route POST /api/interview/report/:interviewId
 * @description  generate new interview report by interview id
 * @access private
 */
interviewRouter.get("/report/:interviewId",authMiddleware.authUser,interviewController.getInterviewReportByIdController)



/**
 * @Route POST /api/interview
 * @description get all interview report of logged in user
 * @access private
 */
interviewRouter.get("/",authMiddleware.authUser,interviewController.getAllInterviewReportController )

module.exports = interviewRouter;