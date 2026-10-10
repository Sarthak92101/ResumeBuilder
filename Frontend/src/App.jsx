import { Suspense } from "react";
import { RouterProvider } from "react-router";
import { router } from "./app.routes.jsx";
import { AuthProvider } from "./features/auth/auth.context.jsx";
import { InterviewProvider } from "./features/interview/interview.context.jsx";
import LoadingExperience from "./components/ui/LoadingExperience.jsx";

function App() {
  return (
    <AuthProvider>
      <InterviewProvider>
        <Suspense fallback={<LoadingExperience />}>
          <RouterProvider router={router} />
        </Suspense>
      </InterviewProvider>
   
    </AuthProvider>
  );
}

export default App;
