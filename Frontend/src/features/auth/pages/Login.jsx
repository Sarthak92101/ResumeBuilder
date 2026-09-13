import React, { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../hooks/useAuth"
import AuthLayout from "../components/AuthLayout"
import { Button, Input } from '../../../components/ui'

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
    <AuthLayout title="Welcome back" subtitle="Sign in to your account">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {error && <div style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', background: 'rgba(229,72,77,0.08)', color: 'var(--color-danger)', border: '1px solid rgba(229,72,77,0.2)' }}>{error}</div>}

        <Input label="Email" type="email" name="email" id="email" placeholder="you@example.com" required autoComplete="email" onChange={(e) => setEmail(e.target.value)} />
        <Input label="Password" type="password" name="password" id="password" placeholder="Enter your password" required autoComplete="current-password" onChange={(e) => setPassword(e.target.value)} />

        <Button type="submit" variant="primary" size="lg" style={{ width: '100%' }}>Sign in</Button>
      </form>

      <p style={{ marginTop: 'var(--space-5)', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
        Don&apos;t have an account? <Link to="/register" style={{ color: 'var(--color-accent)', fontWeight: 600, textDecoration: 'none' }}>Create one</Link>
      </p>
    </AuthLayout>
  )
}

export default Login
