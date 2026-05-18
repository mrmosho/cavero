import { createContext, useContext, useState } from 'react'
const AdminContext = createContext(null)
const SESSION_KEY = 'cavero_admin_session'
const SESSION_EXPIRY = 24 * 60 * 60 * 1000
export function AdminProvider({ children }) {
  const [authed, setAuthed] = useState(() => { try { const s = JSON.parse(localStorage.getItem(SESSION_KEY)); return s && Date.now() < s.expires } catch { return false } })
  const login = (password) => {
    const correct = import.meta.env.VITE_ADMIN_PASSWORD
    if (!correct || password !== correct) return false
    localStorage.setItem(SESSION_KEY, JSON.stringify({ expires: Date.now() + SESSION_EXPIRY }))
    setAuthed(true)
    return true
  }
  const logout = () => { localStorage.removeItem(SESSION_KEY); setAuthed(false) }
  return <AdminContext.Provider value={{ authed, login, logout }}>{children}</AdminContext.Provider>
}
export function useAdmin() { const ctx = useContext(AdminContext); if (!ctx) throw new Error('useAdmin must be used inside AdminProvider'); return ctx }
