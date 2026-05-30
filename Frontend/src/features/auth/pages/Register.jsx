import React, { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../hooks/useAuth"
import AuthLayout from "../components/AuthLayout"

const Register = () => {
  const navigate = useNavigate()
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  const { loading, handleRegister } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    const success = await handleRegister({ username, email, password })
    if (success) {
      navigate("/")
    } else {
      setError("Could not create account. Username or email may already exist.")
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
      title="Create account"
      subtitle="Join to build AI-powered interview strategies from your resume."
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        {error && <div className="auth-error">{error}</div>}

        <div className="input-group">
          <label htmlFor="username">Username</label>
          <input
            onChange={(e) => setUsername(e.target.value)}
            type="text"
            name="username"
            id="username"
            placeholder="Choose a username"
            required
            autoComplete="username"
          />
        </div>

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
            placeholder="Create a strong password"
            required
            minLength={6}
            autoComplete="new-password"
          />
        </div>

        <button type="submit" className="button primary-button auth-submit">
          Get started
        </button>
      </form>

      <p className="auth-footer">
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </AuthLayout>
  )
}

export default Register
