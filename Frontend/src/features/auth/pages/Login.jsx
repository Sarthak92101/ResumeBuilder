import React, { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../hooks/useAuth"
import AuthLayout from "../components/AuthLayout"

const Login = () => {
  const { loading, handleLogin } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    const success = await handleLogin({ email, password })
    if (success) {
      navigate("/")
    } else {
      setError("Invalid email or password. Please try again.")
    }
  }

  if (loading) {
    return (
      <main className="loading-screen">
        <h1>Loading…</h1>
      </main>
    )
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to access your interview plans and PDF exports."
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        {error && <div className="auth-error">{error}</div>}

        <div className="input-group">
          <label htmlFor="email">Email</label>
          <input
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            name="email"
            id="email"
            placeholder="you@example.com"
            required
            autoComplete="email"
          />
        </div>

        <div className="input-group">
          <label htmlFor="password">Password</label>
          <input
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            name="password"
            id="password"
            placeholder="Enter your password"
            required
            autoComplete="current-password"
          />
        </div>

        <button type="submit" className="button primary-button auth-submit">
          Sign in
        </button>
      </form>

      <p className="auth-footer">
        Don&apos;t have an account? <Link to="/register">Create one</Link>
      </p>
    </AuthLayout>
  )
}

export default Login
