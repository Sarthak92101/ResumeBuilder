# SkillMirror - AI-Powered Resume Interview Platform

An intelligent web application that generates personalized interview questions and reports based on user resumes using AI technology. This platform helps job seekers prepare for interviews by analyzing their resume and providing targeted interview practice.

---

## 🌟 Features

- **User Authentication**: Secure user registration and login with JWT-based authentication
- **Resume Upload**: Upload and parse PDF resumes (up to 5MB)
- **AI Interview Generation**: Generate custom interview questions based on resume content using Google Generative AI
- **Interview Reports**: Comprehensive interview analysis reports with AI-powered insights
- **PDF Generation**: Download interview reports as PDF documents
- **Protected Routes**: Secure access to interview features with role-based protection
- **Session Management**: Persistent user sessions with token blacklisting for logout
- **Responsive UI**: Modern, user-friendly interface built with React

---

## 🏗️ Project Architecture

### Tech Stack

**Frontend:**
- React 19.2.5
- Vite (build tool)
- React Router v7 (navigation)
- Axios (HTTP client)
- SASS (styling)

**Backend:**
- Express.js 5.2.1 (web framework)
- MongoDB 9.4.1 (database)
- JWT (authentication)
- Puppeteer 24.43.1 (PDF generation)
- Google Generative AI SDK (AI features)
- Multer 2.1.1 (file upload handling)
- Bcrypt (password hashing)

### Folder Structure

```
SkillMirror/
├── Frontend/                          # React + Vite application
│   ├── src/
│   │   ├── features/
│   │   │   ├── auth/                 # Authentication feature
│   │   │   │   ├── pages/            # Login & Register pages
│   │   │   │   ├── components/       # Auth components & Protected route
│   │   │   │   ├── hooks/            # useAuth custom hook
│   │   │   │   ├── services/         # API calls
│   │   │   │   └── auth.context.jsx  # Auth context provider
│   │   │   ├── interview/            # Interview feature
│   │   │   │   ├── pages/            # Home & Interview pages
│   │   │   │   ├── hooks/            # useInterview hook
│   │   │   │   ├── services/         # Interview API calls
│   │   │   │   └── interview.context.jsx
│   │   │   └── about/                # About page
│   │   ├── components/               # Shared components
│   │   ├── styles/                   # Global styles & theme
│   │   ├── App.jsx                   # Root component
│   │   ├── app.routes.jsx            # Route configuration
│   │   └── main.jsx                  # Entry point
│   ├── index.html
│   ├── vite.config.js                # Vite configuration
│   ├── eslint.config.js              # ESLint configuration
│   └── package.json
│
├── Backend/                           # Express.js server
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js           # MongoDB connection
│   │   ├── controllers/              # Request handlers
│   │   │   ├── auth.controller.js    # Auth logic
│   │   │   └── interview.controller.js
│   │   ├── models/                   # Database schemas
│   │   │   ├── user.model.js
│   │   │   ├── interviewReport.model.js
│   │   │   └── blacklist.model.js
│   │   ├── routes/                   # API endpoints
│   │   │   ├── auth.routes.js
│   │   │   └── interview.routes.js
│   │   ├── middlewares/              # Express middlewares
│   │   │   ├── auth.middleware.js    # JWT verification
│   │   │   └── file.middleware.js    # Multer configuration
│   │   ├── services/
│   │   │   └── ai.service.js         # Google Generative AI integration
│   │   ├── utils/
│   │   │   └── pdf.util.js           # PDF generation utility
│   │   └── app.js                    # Express app setup
│   ├── server.js                     # Server entry point
│   └── package.json
│
├── package.json                      # Root dependencies (Puppeteer)
└── .gitignore
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v16+)
- **npm** or **yarn**
- **MongoDB** (local or MongoDB Atlas)
- **Google Generative AI API Key** (from Google AI Studio)

### Installation

#### 1. Clone the Repository

```bash
git clone <repository-url>
cd SkillMirror
```

#### 2. Set Up Environment Variables

Create a `.env` file in the `Backend/` directory:

```env
# MongoDB Connection
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/skillmirror?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRY=7d

# Google Generative AI
GOOGLE_AI_API_KEY=your_google_genai_api_key_here

# Port Configuration
PORT=3000

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

#### 3. Install Backend Dependencies

```bash
cd Backend
npm install
```

#### 4. Install Frontend Dependencies

```bash
cd ../Frontend
npm install
```

### Running the Application

#### Development Mode

**Terminal 1 - Backend Server:**

```bash
cd Backend
npm run dev
```

Server runs on: `http://localhost:3000`

**Terminal 2 - Frontend Dev Server:**

```bash
cd Frontend
npm run dev
```

Frontend runs on: `http://localhost:5173`

#### Production Build

**Frontend:**

```bash
cd Frontend
npm run build
```

Output: `Frontend/dist/`

**Backend:**

```bash
cd Backend
npm start
```

---

## 📚 API Endpoints

### Authentication Routes (`/api/auth`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/register` | Register new user | ❌ |
| POST | `/login` | Login user | ❌ |
| GET | `/logout` | Logout user | ✅ |
| GET | `/me` | Get current user | ✅ |

### Interview Routes (`/api/interview`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/` | Generate interview report | ✅ |
| GET | `/` | Get all interview reports | ✅ |
| GET | `/:interviewId` | Get specific report | ✅ |
| GET | `/:interviewId/pdf` | Download report as PDF | ✅ |

---

## 🔐 Authentication

The application uses **JWT (JSON Web Tokens)** for authentication:

1. User registers or logs in
2. Server returns a JWT token stored in cookies
3. Token is sent with each request in the `Authorization` header
4. Token is verified by `authMiddleware` on protected routes
5. On logout, token is blacklisted to prevent reuse

### Protected Routes

- `/` - Home (interview list)
- `/interview/:interviewId` - View interview report

### Public Routes

- `/about` - About page
- `/login` - Login page
- `/register` - Registration page

---

## 📝 Resume Upload & Interview Process

1. **Upload Resume**: User uploads a PDF resume (max 5MB)
2. **Parse Resume**: Backend extracts text from PDF
3. **Generate Questions**: Google Generative AI analyzes resume and creates interview questions
4. **Store Report**: Interview report saved to MongoDB
5. **Download PDF**: User can download report as formatted PDF using Puppeteer

---

## 🛠️ Configuration

### CORS Configuration

Edit `Backend/src/app.js` to update allowed origins:

```javascript
app.use(cors({
  origin: "http://localhost:5173", // Update for production
  credentials: true
}))
```

### File Upload Limits

Edit `Backend/src/middlewares/file.middleware.js` to modify upload restrictions:

```javascript
const upload = multer({
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
})
```

### Database Connection

Edit `Backend/src/config/database.js` for MongoDB configuration.

---

## 📦 Deployment

### Frontend Hosting (Recommended: Vercel)

1. Build the frontend: `npm run build`
2. Deploy `Frontend/dist` folder to Vercel
3. Set environment variable for backend API URL

### Backend Hosting (Recommended: Railway/Render)

1. Set environment variables on hosting platform
2. Deploy Backend folder
3. Ensure MongoDB Atlas is accessible from production server
4. Update CORS origin to production frontend URL

### Complete Deployment Guide

See [HOSTING.md](./HOSTING.md) for step-by-step deployment instructions.

---

## 🧪 Testing

### Frontend

```bash
cd Frontend
npm run lint  # Run ESLint
npm run dev   # Development server with HMR
```

### Backend

```bash
cd Backend
npm run dev   # Run with Nodemon (auto-reload)
```

---

## 🔧 Available Scripts

### Frontend

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Build for production |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview production build |

### Backend

| Command | Description |
|---------|-------------|
| `npm run dev` | Start server with auto-reload (Nodemon) |
| `npm start` | Start production server |

---

## 🐛 Troubleshooting

### MongoDB Connection Issues

- Verify MongoDB Atlas connection string in `.env`
- Check IP whitelist in MongoDB Atlas
- Ensure `MONGO_URI` has correct credentials

### CORS Errors

- Update `FRONTEND_URL` in backend `.env`
- Update `origin` in `Backend/src/app.js`

### File Upload Errors

- Check file size (max 5MB)
- Ensure file is a valid PDF
- Verify multer configuration

### Google AI API Issues

- Get API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
- Verify API is enabled and has quota
- Check `GOOGLE_AI_API_KEY` in `.env`

---

## 📄 License

ISC License

---

## 👨‍💻 Developer

Created with ❤️ for improving interview preparation

---

## 📞 Support

For issues or questions, please create an issue in the repository.

---

## 🚀 Future Enhancements

- [ ] Real-time interview recording and playback
- [ ] Video interview simulation
- [ ] Multiple resume analysis
- [ ] Industry-specific interview templates
- [ ] Performance analytics and tracking
- [ ] Feedback from AI on answers
- [ ] Integration with LinkedIn
- [ ] Mobile app
