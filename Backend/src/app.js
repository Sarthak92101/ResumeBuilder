const express = require('express');
const cookieParser = require('cookie-parser');
const cors =require("cors")

const app=express()

app.use(express.json())
app.use(cookieParser())
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:5174',
].filter(Boolean)

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true)
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true)
    }
    const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`
    return callback(new Error(msg), false)
  },
  credentials: true,
}))


/* Require all the routes here */
const authRouter=require("./routes/auth.routes")
const interviewRouter=require("./routes/interview.routes")
const resumeRouter = require("./routes/resume.routes")


/* using all the routes here */
app.use("/api/auth",authRouter)
app.use("/api/interview",interviewRouter )
app.use("/api/resume", resumeRouter)


module.exports=app;