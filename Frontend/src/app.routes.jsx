import { createBrowserRouter } from "react-router-dom";
import Home from "./features/interview/pages/Home";
import Login from "./features/auth/pages/Login";
import Register from "./features/auth/pages/Register";
import Protected from "./features/auth/components/Protected";

export const router = createBrowserRouter([
 
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
    path: "*",
    element: <h1>404 Page Not Found</h1>,
  },
]);