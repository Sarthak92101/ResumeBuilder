import { createBrowserRouter } from "react-router-dom";
import Home from "./features/interview/pages/Home";
import Interview from "./features/interview/pages/interview";
import Login from "./features/auth/pages/Login";
import Register from "./features/auth/pages/Register";
import About from "./features/about/pages/About";
import Protected from "./features/auth/components/Protected";
import Dashboard from "./features/dashboard/pages/Dashboard";
import MyResumes from "./features/resume/pages/MyResumes";
import AtsScoreChecker from "./features/resume/pages/AtsScoreChecker";
import VoiceInterview from "./features/interview/pages/VoiceInterview";
import GapAnalysis from "./features/interview/pages/GapAnalysis";
import SharedReport from "./features/interview/pages/SharedReport";

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