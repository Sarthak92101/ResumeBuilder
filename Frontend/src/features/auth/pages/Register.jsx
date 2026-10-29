import React, { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../hooks/useAuth"
import AuthLayout from "../components/AuthLayout"
import { Button, Input } from '../../../components/ui'

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
    const result = await handleRegister({ username, email, password })
    if (result.success) {
      navigate("/")
    } else {
      setError(result.message)
    }
  }

  return (
    <AuthLayout title="Create account" subtitle="Get started in seconds">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {error && <div role="alert" style={{ display: 'grid', gap: 'var(--space-2)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', background: 'rgba(229,72,77,0.08)', color: 'var(--color-danger)', border: '1px solid rgba(229,72,77,0.2)' }}>
          <span>{error}</span>
          {/already exists|already registered|account already/i.test(error) && <Link to="/login" style={{ color: 'var(--color-accent)', fontWeight: 700, textDecoration: 'none' }}>Go to sign in →</Link>}
        </div>}

        <Input label="Username" type="text" name="username" id="username" placeholder="Choose a username" required autoComplete="username" onChange={(e) => setUsername(e.target.value)} />
        <Input label="Email" type="email" name="email" id="email" placeholder="you@example.com" required autoComplete="email" onChange={(e) => setEmail(e.target.value)} />
        <Input label="Password" type="password" name="password" id="password" placeholder="Create a strong password" required minLength={6} autoComplete="new-password" showPasswordToggle onChange={(e) => setPassword(e.target.value)} />

        <Button type="submit" variant="primary" size="lg" disabled={loading} style={{ width: '100%' }}>
          {loading ? 'Preparing your account…' : 'Get started'}
        </Button>
      </form>

      <p style={{ marginTop: 'var(--space-5)', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
        Already have an account? <Link to="/login" style={{ color: 'var(--color-accent)', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
      </p>
    </AuthLayout>
  )
}

export default Register
