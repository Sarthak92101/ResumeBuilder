 const pdfParser = require("pdf-parse")
const generateInterviewReport = require("../services/ai.service")
const interviewReportModel = require("../models/interviewReport.model")

async function generateInterviewReportController(req, res) {
  const resumeContent = await pdfParser(req.file.buffer)
  const { selfDescription, jobDescription } = req.body
  const interviewReportByAi = await generateInterviewReport({
    resume: resumeContent.text,
    selfDescription,
    jobDescription,
  })
    const interviewReport=await interviewReportModel.create({
      user:req.user.id,
      resume:resumeContent.text,
      selfDescription,
      jobDescription,
      ...interviewReportByAi
    })

    res.status(201).json({
      message:"Interview report generated successfully",
      interviewReport
    })

}
/**
   
 * @description  Controller to get interview report by interview id

 */

async function getInterviewReportByIdController(req,res){
  const { interviewId } = req.params;
  const interviewReport=await interviewReportModel.findByOne({_id:interviewId,user:req.user.id})

  if(!interviewReport){
    return res.status(404).json({
      message:"Interview report not found"
    })

  }
  res.status(200).json({
    message:"Interview report found",
    interviewReport
  })
}

/**
 *  
 * @description  Controller to get all interview report of logged in user
 */
async function getAllInterviewReportController(req, res) {
  const interviewReport=await interviewReportModel.find({user:req.user.id}).sort({createdAt:-1}).select("-resume -selfDescription -jobDescription -__v -tecgnicalQuestions -behaviouralQuestions -skillGaps -preparationPlan ")
  res.status(200).json({
    message:"Interview report found",
    interviewReport
  })
}   


module.exports = { generateInterviewReportController,getInterviewReportByIdController,getAllInterviewReportController}   