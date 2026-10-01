import { useEffect, useState } from 'react'
import { AuthContext } from './authContext'
import { api } from '../services/api'

const USER_KEY = 'campus_exchange_user'
const TOKEN_KEY = 'campus_exchange_token'

function getStoredUser() {
  if (!localStorage.getItem(TOKEN_KEY)) return null
  try { return JSON.parse(localStorage.getItem(USER_KEY)) || null } catch { return null }
}

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(() => getStoredUser())
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem(TOKEN_KEY)))
  const setUser = value => { setUserState(value); if (value) localStorage.setItem(USER_KEY, JSON.stringify(value)); else localStorage.removeItem(USER_KEY) }
  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) return
    let active = true
    api.me().then(setUser).catch(() => { localStorage.removeItem(TOKEN_KEY); setUser(null) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])
  const login = async payload => { const response = await api.login(payload); localStorage.setItem(TOKEN_KEY, response.access_token); setUser(response.user); setLoading(false); return response.user }
  const register = payload => api.register(payload)
  const logout = () => { localStorage.removeItem(TOKEN_KEY); setUser(null); setLoading(false) }
  return <AuthContext.Provider value={{ user, loading, login, register, logout, setUser }}>{children}</AuthContext.Provider>
}
