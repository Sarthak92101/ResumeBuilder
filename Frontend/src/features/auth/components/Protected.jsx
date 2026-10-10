import { useAuth } from "../hooks/useAuth";
import { Navigate } from "react-router-dom";
import React from "react";
import LoadingExperience from "../../../components/ui/LoadingExperience.jsx";

const Protected = ({ children }) => {
  const { loading, user } = useAuth();

  if (loading) {
    return <LoadingExperience title="Getting your workspace ready" detail="Checking your saved session so we can bring up your preparation tools." />;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
};

export default Protected;
