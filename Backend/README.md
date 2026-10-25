# SkillMirror Backend

The SkillMirror backend is an Express API that handles accounts, resume uploads, interview preparation, AI feedback, sharing, and PDF exports. It stores app data in MongoDB, uses OpenAI for SAVIK interview replies and resume suggestions, and Google Gemini for the other AI features.

## Requirements

- Node.js and npm
- MongoDB locally or a MongoDB Atlas cluster
- An OpenAI API key for SAVIK interview replies
- A Google Gemini API key for the other AI-powered features
- Tectonic on `PATH` for LaTeX resume PDF exports

## Setup

```bash
cp .env.example .env
npm install
npm run dev
```

The API runs on `http://localhost:3000` by default. Configure `Backend/.env` before starting:

| Variable | Required | Purpose |
| --- | --- | --- |
| `MONGO_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Secret used to sign authentication tokens |
| `OPENAI_API_KEY` | For SAVIK | OpenAI API key |
| `OPENAI_MODEL` | No | SAVIK model; defaults to `gpt-6-luna` |
| `OPENAI_REASONING_EFFORT` | No | SAVIK reasoning effort; defaults to `none` for faster replies |
| `GOOGLE_API_KEY` | For other AI features | Google Gemini API key |
| `GEMINI_MODEL` | No | Gemini model; defaults to `gemini-3.8-flash` |
| `GEMINI_USER_DAILY_LIMIT` | No | Maximum Gemini-powered requests per user per UTC day; SAVIK/OpenAI calls are excluded; defaults to `20` |
| `GEMINI_USER_COOLDOWN_MS` | No | Minimum delay between a user's Gemini-powered requests; defaults to `10000` ms |
| `FRONTEND_URL` | Yes for the deployed app | Frontend origin allowed by CORS |
| `GITHUB_TOKEN` | No | Raises GitHub API rate limits for profile lookup |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM` | No | Email reminders |
| `TECTONIC_BIN` | No | Absolute path to Tectonic if it is not on `PATH` |

Use `.env.example` as the complete configuration template. Keep real credentials in `.env` or the deployment platform's secret settings; do not commit them.

## Main capabilities

- Account registration, login, and protected API routes.
- PDF resume upload, saved resume management, and LaTeX resume PDF export.
- Gemini-generated interview plans, role and resume analysis, STAR feedback, and ATS estimates.
- Voice Mock Interview support and a separate CV-aware SAVIK AI Avatar Interview. SAVIK turns can stream replies to the frontend.
- Interview progress, shareable reports, and mentor comments.
- Optional GitHub, LeetCode, and Codeforces profile lookups.
- Coding and grammar practice endpoints.

## API route groups

| Route | Purpose |
| --- | --- |
| `/api/auth` | Registration, login, logout, and current-user details |
| `/api/resume` | Resume upload/listing and saved ATS analyses |
| `/api/interview` | Interview plans, reports, ATS/STAR checks, gap analysis, voice practice, SAVIK, sharing, coding, and grammar tools |
| `/api/github`, `/api/leetcode`, `/api/codeforces` | Optional developer profile summaries |

Most endpoints require the authentication cookie. Shared-report views and comments use the share token routes under `/api/interview/shared`.

## PDF generation

- Resume PDFs are compiled from LaTeX with [Tectonic](https://tectonic-typesetting.github.io/). On macOS, install it with `brew install tectonic`. If it is installed outside `PATH`, set `TECTONIC_BIN` to its executable path.
- Full interview-plan PDFs are rendered with Puppeteer. The backend host must support Puppeteer's browser runtime and required system libraries.

## Scripts

```bash
npm run dev   # Start with nodemon
npm start      # Start the API server
```
