import { useEffect, useState } from 'react'
import * as service from '../services/authService'
import { getToken, setToken, subscribeSession } from '../auth/session'
import { AuthContext } from './authContextValue'
export function AuthProvider({ children }) {
  const [token, updateToken] = useState(getToken)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(Boolean(getToken()))
  const [error, setError] = useState(false)
  async function refreshUser() {
    const current = getToken()
    if (!current) return
    setLoading(true)
    setError(false)
    try {
      const user = await service.getCurrentUser()
      if (getToken() === current) setProfile({ token: current, user })
    } catch {
      if (getToken() === current) setError(true)
    } finally {
      if (getToken() === current) setLoading(false)
    }
  }
  useEffect(
    () =>
      subscribeSession((value) => {
        updateToken(value)
        setProfile(null)
        setError(false)
        setLoading(Boolean(value))
      }),
    [],
  )
  useEffect(() => {
    if (token) Promise.resolve().then(refreshUser)
  }, [token])
  async function authenticate(method, data) {
    const result = await service[method](data)
    setToken(result.token)
  }
  const user = profile?.token === token ? profile.user : null
  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        isAuthenticated: Boolean(user),
        refreshUser,
        login: (data) => authenticate('login', data),
        register: (data) => authenticate('register', data),
        logout: () => setToken(null),
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
