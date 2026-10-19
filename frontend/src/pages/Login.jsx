import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { login } from '../services/api'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../context/ToastContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { signIn } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!email || !password) { setError('Email and password required'); return }
    setLoading(true)
    try {
      const res = await login(email, password)
      signIn(res.data.data.user, res.data.data.token)
      addToast(`Welcome back, ${res.data.data.user.fullName}!`, 'success')
      navigate(res.data.data.user.role === 'admin' ? '/admin' : '/dashboard')
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid credentials'
      setError(msg)
      addToast(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🚶</div>
          <h1 className="text-3xl font-bold text-white">Walkathon Tracker</h1>
          <p className="text-blue-200 mt-1">Team Walking Challenge</p>
        </div>

        <div className="card p-8 animate-fade-in">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Sign In</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} autoFocus />
            </div>
            <div>
              <label className="label">Password</label>
              <input className="input" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button className="btn-primary w-full" type="submit" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div className="mt-4 text-center text-sm text-gray-500">
            New here?{' '}
            <Link to="/register" className="text-blue-600 hover:underline font-medium">Register</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
