import { lazy } from "react";
import { createBrowserRouter } from "react-router-dom";
import Protected from "./features/auth/components/Protected";

const Home = lazy(() => import("./features/interview/pages/Home"));
const Interview = lazy(() => import("./features/interview/pages/interview"));
const Login = lazy(() => import("./features/auth/pages/Login"));
const Register = lazy(() => import("./features/auth/pages/Register"));
const About = lazy(() => import("./features/about/pages/About"));
const Dashboard = lazy(() => import("./features/dashboard/pages/Dashboard"));
const MyResumes = lazy(() => import("./features/resume/pages/MyResumes"));
const AtsScoreChecker = lazy(() => import("./features/resume/pages/AtsScoreChecker"));
const AvatarCoach = lazy(() => import("./features/interview/pages/AvatarCoach"));
const VoiceInterview = lazy(() => import("./features/interview/pages/VoiceInterview"));
const GapAnalysis = lazy(() => import("./features/interview/pages/GapAnalysis"));
const SharedReport = lazy(() => import("./features/interview/pages/SharedReport"));

export const router = createBrowserRouter([
  {
    path: "/about",
    element: <About />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },
   {
    path: "/",
    element: <Protected><Home /></Protected>
  },
  {
    path: "/dashboard",
    element: <Protected><Dashboard /></Protected>
  },
  {
    path: "/ats",
    element: <Protected><AtsScoreChecker /></Protected>
  },
  {
    path: "/ai-coach",
    element: <Protected><AvatarCoach /></Protected>
  },
  {
    path: "/resumes",
    element: <Protected><MyResumes /></Protected>
  },
  {
    path: "/interview/:interviewId",
    element: <Protected><Interview /></Protected>
  },
  {
    path: "/voice/:interviewId",
    element: <Protected><VoiceInterview /></Protected>
  },
  {
    path: "/gap-analysis",
    element: <Protected><GapAnalysis /></Protected>
  },
  {
    path: "/shared/:shareToken",
    element: <SharedReport />,
  },
  {
    path: "*",
    element: <h1>404 Page Not Found</h1>,
  },
]);
