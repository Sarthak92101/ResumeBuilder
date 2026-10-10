# SkillMirror Presentation Prompt

Copy everything below the line into your presentation tool (Gamma, Claude, ChatGPT, Copilot, Canva AI, etc.).

---

Create a professional, visually engaging 16 to 18 slide presentation for a project called **SkillMirror**, an AI powered interview preparation platform. Use a modern dark tech theme with violet (#7c3aed) and sky blue (#38bdf8) as accent colors, clean sans serif typography, and one clear idea per slide. Include speaker notes for every slide. Where a diagram is mentioned, describe or draw it.

## Slide 1: Title
SkillMirror: Your AI Interview Coach. Tagline: "Build interview strategies with a resume analyzer and personalized question planner." Add team name, institution, and date placeholders.

## Slide 2: The Problem
Candidates prepare for interviews blindly. They do not know how well their resume matches a job, what questions to expect, which skills they are missing, or how they actually sound when answering. Existing tools are either generic question banks or expensive human mock interviews. Show 3 to 4 pain points as icons.

## Slide 3: The Solution
SkillMirror takes a candidate's resume, a job description, an optional self description, target company, and their public coding profiles, and generates a fully personalized preparation report: match score, readiness score, technical and behavioural questions with model answers, skill gaps with severity, and a 5 day preparation plan. Then it lets the user practise those questions with voice, code, and instant AI feedback.

## Slide 4: Core Feature: AI Interview Report Generation
Explain the input to output flow. Inputs: PDF resume (parsed with pdf-parse, 5 MB limit), job description, self description, target company, interview date, language (English, Hindi, Hinglish). Output (validated with Zod schemas): matchScore, readiness score, job title, 5 technical questions (each with difficulty, interviewer intention, answer, model answer, isCoding flag, and test cases), 5 behavioural questions, 3 to 5 skill gaps with low/medium/high severity, and a 5 day preparation plan. Mention company aware prompting (for example Amazon leadership principle style behavioural questions).

## Slide 5: Developer Profile Integration
SkillMirror pulls real data from GitHub (repos, languages, stars, README summaries), LeetCode (solved counts by Easy/Medium/Hard and top topics), and Codeforces (rating, max rating, rank, tag wise solved). The AI is instructed to ask at least 2 of 5 technical questions about the candidate's actual repositories, probe weak DSA topics, and verify depth on the strongest topic. Profile strength also influences the readiness score. Show a small pie chart concept for LeetCode difficulty spread.

## Slide 6: ATS Resume Scoring
Two modes: quick ATS score (match percentage, matched keywords, missing keywords) and detailed ATS score with a breakdown across keyword match, formatting, achievements, action verbs, and section completeness, plus concrete suggestions. Users can upload and store multiple resumes and view score history per resume.

## Slide 7: Practice Tools Inside the Report
Four practice tools on one slide, each as a card:
1. STAR Answer Checker: evaluates whether a behavioural answer covers Situation, Task, Action, Result and gives improvement advice.
2. Live Code Runner: Monaco editor in the browser, code executed through Judge0 in JavaScript, Python, or Java, checked against AI generated test cases.
3. Grammar Check: LanguageTool integration that flags grammar issues and suggests fixes in written answers.
4. Adaptive Next Question: AI generates the next question based on the previous answer, so difficulty adapts in real time.

## Slide 8: Voice Interview Mode
Browser based mock interview using the Web Speech API. Questions are read aloud with speech synthesis, the candidate answers by speaking, speech recognition transcribes it, and Gemini scores the transcript on clarity and structure, counts filler words, and returns up to 5 tips. No extra hardware or app needed.

## Slide 9: Gap Analysis and Preparation Plan
Skill by skill comparison between the resume and the job description. Each skill is labelled Have, Add to resume, or Learn, with a suggestion. The 5 day preparation plan turns gaps into daily focus areas and tasks.

## Slide 10: Mentor Sharing and Collaboration
Any report can be shared through a public token link. Mentors, seniors, or friends can open the report without logging in and leave comments directly on it. Comments are stored with the report and visible to the candidate.

## Slide 11: Dashboard, Reminders, and Exports
Dashboard with a readiness score trend line (Recharts) and average score across all reports. Email reminders sent automatically 3 days before the interview date through a node-cron job and Nodemailer. One click PDF export of the full report and a professionally formatted resume PDF, both generated with Puppeteer and branded with a SkillMirror watermark. Light and dark themes.

## Slide 12: System Architecture
Draw a three tier architecture diagram:
- Frontend: React 19, Vite, React Router 7, SCSS design tokens, Recharts, Monaco Editor, Axios, Context API for auth, interview, and theme state.
- Backend: Node.js with Express 5, JWT auth with httpOnly cookies and a token blacklist for logout, bcrypt password hashing, Multer for uploads, Zod for AI output validation.
- Database: MongoDB with Mongoose. Models: User, Resume, ATS Score, Interview Report, Blacklist.
- External services: Google Gemini (with automatic model fallback across gemini-2.5-flash, 2.0-flash, 1.5-flash, 1.5-pro), GitHub REST API, LeetCode GraphQL, Codeforces API, Judge0, LanguageTool, SMTP.

## Slide 13: AI Pipeline and Reliability
Show the prompt engineering pipeline: truncate inputs to safe limits, build a structured prompt with schema and rules, request JSON mode from Gemini, strip code fences, extract and repair JSON, validate with Zod, normalize field names, and retry once in strict mode if the output was invalid. Highlight quota and model fallback handling so users see friendly error messages instead of crashes.

## Slide 14: Tech Stack Summary
A clean grid of logos or labels: React, Vite, SCSS, Recharts, Monaco, Node.js, Express, MongoDB, Mongoose, JWT, Zod, Puppeteer, Gemini API, Judge0, LanguageTool, Nodemailer, node-cron.

## Slide 15: Demo Flow
A numbered walkthrough: Register or login, upload resume and paste job description, add GitHub/LeetCode/Codeforces handles and see live previews, generate the report, practise a coding question in the editor, run a voice mock interview, check STAR structure of a behavioural answer, share the report with a mentor, download the PDF.

## Slide 16: Future Scope (Part 1)
Present as a roadmap or timeline with short descriptions:
- Multimodal AI emotion analysis: use the webcam during voice interviews to analyse facial expressions, eye contact, and posture, and combine it with voice tone to give confidence and nervousness scores.
- Gemini Live audio integration: replace browser speech APIs with Gemini's native real time audio so the AI interviewer can interrupt, follow up naturally, and hold a fluid two way conversation with low latency.
- Peer-to-Peer interview rooms: WebRTC based rooms where two candidates interview each other with AI generated question sets, live code sharing, and an AI observer that scores both participants afterwards.
- Whiteboard system design tool: a collaborative canvas for system design rounds where the candidate draws architectures and the AI reviews scalability, bottlenecks, and trade offs.
- LinkedIn and Portfolio crawler: automatically import experience, projects, and endorsements from LinkedIn and personal portfolio sites to enrich the profile without manual entry.

## Slide 17: Future Scope (Part 2)
- Enterprise recruiter portal: companies can create job postings, invite candidates, run standardised AI screening interviews, and view ranked candidate dashboards with anti cheating signals.
- React Native mobile app: full mobile experience with push notification reminders, offline access to preparation plans, and on the go voice practice.
- AI resume builder and rewriter: generate or rewrite resume bullet points tailored to a specific job description using the ATS breakdown as a guide.
- Company specific question banks: continuously updated question sets per company and role, crowdsourced from user reports and verified by the community.
- Multi language expansion: extend beyond English, Hindi, and Hinglish to regional and global languages with localised voice models.
- Gamification and streaks: daily practice streaks, badges, leaderboards among friends, and progress milestones.
- Plagiarism and AI answer detection: flag answers that appear copied or AI generated during timed practice sessions.
- Browser extension: one click "Prepare for this job" button on LinkedIn, Naukri, and Indeed job pages.
- Analytics for mentors: mentor accounts with dashboards that track multiple mentees' progress over time.
- Scalability upgrades: Redis caching for profile fetches, a job queue for report generation, and WebSocket based live progress updates.

## Slide 18: Conclusion and Thank You
Summarise in three lines: personalised, practical, and measurable interview preparation. Add a call to action to try the demo, a QR code placeholder for the GitHub repository, and team contact placeholders.

Formatting requirements: keep text on each slide under 60 words except the future scope and architecture slides, use icons and diagrams generously, keep a consistent visual style across all slides, and write speaker notes in a confident, conversational tone suitable for a 10 minute project presentation.
