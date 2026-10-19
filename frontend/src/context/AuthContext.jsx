import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = localStorage.getItem('wt_token')
    const u = localStorage.getItem('wt_user')
    if (t && u) {
      setToken(t)
      setUser(JSON.parse(u))
    }
    setLoading(false)
  }, [])

  function signIn(userData, jwt) {
    setUser(userData)
    setToken(jwt)
    localStorage.setItem('wt_token', jwt)
    localStorage.setItem('wt_user', JSON.stringify(userData))
  }

  function signOut() {
    setUser(null)
    setToken(null)
    localStorage.removeItem('wt_token')
    localStorage.removeItem('wt_user')
  }

  return (
    <AuthContext.Provider value={{ user, token, signIn, signOut, isAuthenticated: !!token, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
