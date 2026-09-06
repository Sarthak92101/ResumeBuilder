import { useState } from "react";
import { InterviewContext } from "./context";

export const InterviewProvider = ({ children }) => {
    const [loading, setLoading] = useState(false)
    const [report, setReport] = useState(null)
    const [reports, setReports] = useState([])
    const [lastWarnings, setLastWarnings] = useState([])

    // Adaptive difficulty session state
    const [runningScore, setRunningScore] = useState(null)
    const [previousQuestions, setPreviousQuestions] = useState([])

    return (
        <InterviewContext.Provider value={{
            loading, setLoading,
            report, setReport,
            reports, setReports,
            lastWarnings, setLastWarnings,
            runningScore, setRunningScore,
            previousQuestions, setPreviousQuestions,
        }}>
            {children}
        </InterviewContext.Provider>
    )
}