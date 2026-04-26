const {GoogleGenAI, Behavior}=require("@google/genai")
const {z}=require("zod")
const {zodTojsonSchema}=require("zod-to-json-schema") 
const { selfDescription } = require("./temp")
const ai=new GoogleGenAI({
  apiKey:process.env.GOOGLE_API_KEY 
})

const interviewReportSchema=z.object({
  matchScore:z.number().description("A score between 0 to 100 indicating the match between the resume and the job description. "), 
  technicalQuestions:z.array(z.object({
    question:z.string().description("The technical question can be asked in the interview. "),
    intention:z.string().description("The intention of the question"),
    answer:z.string().description("How to answer the question,what points to cover in the answer,what approch to use  ") 
  })).description("The technical questions can be asked in the interview. "),
  BehaviouralQuestions:z.array(z.object({
    question:z.string().description("The behavioural question can be asked in the interview. "),
    intention:z.string().description("The intention of the question"),
    answer:z.string().description("How to answer the question,what points to cover in the answer,what approch to use  ") 
  })).description("The behavioural questions can be asked in the interview. "),
  skillGaps:z.array(z.object({
    skill:z.string().description("The skill gap can be asked in the interview. "),
    severity:z.string().description("The severity of the skill gap can be asked in the interview. ")
  })).description("list of skill gaps in the candidate's profile along with their severity."),
  preparationPlan:z.array(z.object({
    day:z.number().description("The day of the preparation plan can be asked in the interview. "),
    focus:z.string().description("The focus of the preparation plan can be asked in the interview. "),
    tasks:z.array(z.string().description("The tasks of the preparation plan can be asked in the interview. "))
  })).description("A day wise preparation plan for the candidate to follow.  "),
})
   

async function generateInterviewReport({resume,selfDescription,jobDescription}){ 
const response=await ai.model.generateContent({
  model:"gemini-2.5-flash",
  contents:"",
  config:{
    responseMimeType:"application/json",
    responseJsonSchema:zodTojsonSchema(interviewReportSchema) 
  }
})
}

module.exports= invokeGeminiAi