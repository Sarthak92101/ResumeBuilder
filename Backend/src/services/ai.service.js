const { GoogleGenAI } = require("@google/genai");
const { z } = require("zod");
const { zodToJsonSchema } = require("zod-to-json-schema");

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY,
});

const interviewReportSchema = z.object({
  matchScore: z
    .number()
    .describe(
      "A score between 0 to 100 indicating the match between the resume and the job description."
    ),

  technicalQuestions: z
    .array(
      z.object({
        question: z
          .string()
          .describe("Technical interview question."),

        intention: z
          .string()
          .describe("Purpose of asking this question."),

        answer: z
          .string()
          .describe(
            "How to answer the question, key points to cover, and the approach to use."
          ),
      })
    )
    .describe("List of technical interview questions."),

  behaviouralQuestions: z
    .array(
      z.object({
        question: z
          .string()
          .describe("Behavioural interview question."),

        intention: z
          .string()
          .describe("Purpose of asking this question."),

        answer: z
          .string()
          .describe(
            "How to answer the question, key points to cover, and the approach to use."
          ),
      })
    )
    .describe("List of behavioural interview questions."),

  skillGaps: z
    .array(
      z.object({
        skill: z
          .string()
          .describe("Missing or weak skill."),

        severity: z
          .string()
          .describe("Severity level of the skill gap."),
      })
    )
    .describe(
      "List of skill gaps in the candidate profile along with severity."
    ),

  preparationPlan: z
    .array(
      z.object({
        day: z
          .number()
          .describe("Day number in preparation plan."),

        focus: z
          .string()
          .describe("Main focus area for the day."),

        tasks: z
          .array(z.string())
          .describe("Tasks to complete on that day."),
      })
    )
    .describe("Day-wise preparation plan."),
});

async function generateInterviewReport({
  resume,
  selfDescription,
  jobDescription,
}) {
  try {
    const prompt = `
Generate a detailed interview preparation report for the candidate.

Resume:
${resume}

Self Description:
${selfDescription}

Job Description:
${jobDescription}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",

      contents: prompt,

      config: {
        responseMimeType: "application/json",

        responseSchema:
          zodToJsonSchema(interviewReportSchema),
      },
    });

return JSON.parse (response.text) ;

  } catch (error) {
    console.log("AI Service Error:", error);
    throw error;
  }
}

module.exports = generateInterviewReport;