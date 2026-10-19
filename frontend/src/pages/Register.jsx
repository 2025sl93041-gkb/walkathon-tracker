import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { register, getConfig } from '../services/api'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../context/ToastContext'

export default function Register() {
  const [form, setForm] = useState({ fullName: '', email: '', phoneNumber: '', employeeId: '', password: '', chitPreference: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [regOpen, setRegOpen] = useState(null)
  const { signIn } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    getConfig().then(r => setRegOpen(r.data.data.registrationOpen)).catch(() => setRegOpen(false))
  }, [])

  function validate() {
    const e = {}
    if (!form.fullName.trim()) e.fullName = 'Full name required'
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Valid email required'
    if (!form.phoneNumber.trim()) e.phoneNumber = 'Phone number required'
    if (form.password.length < 6) e.password = 'Minimum 6 characters'
    if (!form.chitPreference) e.chitPreference = 'Select your chit preference'
    return e
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setLoading(true)
    try {
      const res = await register(form)
      signIn(res.data.data.user, res.data.data.token)
      addToast('Registration successful! Welcome to the Walkathon 🎉', 'success')
      navigate('/dashboard')
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed'
      addToast(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  if (regOpen === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center p-4">
        <div className="card p-10 max-w-sm w-full text-center">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Registration Closed</h2>
          <p className="text-gray-600 text-sm mb-4">Registration is currently closed. Contact the event admin.</p>
          <Link to="/login" className="btn-secondary btn-sm inline-block">Back to Login</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <span className="text-5xl">🚶</span>
          <h1 className="text-2xl font-bold text-white mt-2">Join the Walkathon</h1>
          <p className="text-blue-200 text-sm">Team Walking Challenge</p>
        </div>

        <div className="card p-8 animate-fade-in">
          <h2 className="text-xl font-semibold text-gray-900 mb-5">Create Account</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <input className="input" placeholder="Jane Smith" value={form.fullName} onChange={set('fullName')} />
              {errors.fullName && <p className="field-error">{errors.fullName}</p>}
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" placeholder="you@company.com" value={form.email} onChange={set('email')} />
              {errors.email && <p className="field-error">{errors.email}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Phone Number</label>
                <input className="input" placeholder="+1-555-0000000" value={form.phoneNumber} onChange={set('phoneNumber')} />
                {errors.phoneNumber && <p className="field-error">{errors.phoneNumber}</p>}
              </div>
              <div>
                <label className="label">Employee ID <span className="text-gray-400 font-normal">(optional)</span></label>
                <input className="input" placeholder="E123456" value={form.employeeId} onChange={set('employeeId')} />
              </div>
            </div>
            <div>
              <label className="label">Password</label>
              <input className="input" type="password" placeholder="Min 6 characters" value={form.password} onChange={set('password')} />
              {errors.password && <p className="field-error">{errors.password}</p>}
            </div>
            <div>
              <label className="label">Chit Draw Preference</label>
              <div className="grid grid-cols-2 gap-3 mt-1">
                {[
                  { value: 'draw', label: '🎲 I will draw a name', sub: 'You pick a partner from the box' },
                  { value: 'be_drawn', label: '📦 Put my name in the box', sub: 'Someone else draws your name' },
                ].map(opt => (
                  <label
                    key={opt.value}
                    className={`border-2 rounded-lg p-3 cursor-pointer transition-all ${form.chitPreference === opt.value ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
                  >
                    <input type="radio" name="pref" value={opt.value} className="sr-only" onChange={set('chitPreference')} />
                    <div className="text-sm font-medium text-gray-900">{opt.label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{opt.sub}</div>
                  </label>
                ))}
              </div>
              {errors.chitPreference && <p className="field-error">{errors.chitPreference}</p>}
            </div>

            <button className="btn-primary w-full mt-2" type="submit" disabled={loading}>
              {loading ? 'Creating account…' : 'Register'}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-4">
            Already registered? <Link to="/login" className="text-blue-600 hover:underline font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
