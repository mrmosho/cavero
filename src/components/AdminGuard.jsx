import { useState } from 'react'
import { useAdmin } from '@/context/AdminContext'
export default function AdminGuard({ children }) {
  const { authed, login } = useAdmin()
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  if (authed) return children
  const handleSubmit = (e) => { e.preventDefault(); const ok = login(password); if (!ok) { setError(true); setPassword('') } }
  return (
    <div style={{ minHeight:'100vh', background:'var(--charcoal)', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ width:'100%', maxWidth:380 }}>
        <div style={{ textAlign:'center', marginBottom:40 }}>
          <h1 style={{ fontFamily:'var(--font-display)', fontSize:'2rem', fontWeight:300, color:'var(--cream)', letterSpacing:'0.15em' }}>Cavero</h1>
          <p style={{ fontSize:'0.7rem', letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--stone)', marginTop:8 }}>Admin</p>
        </div>
        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <input type="password" placeholder="Password" value={password} onChange={e => { setPassword(e.target.value); setError(false) }} autoFocus
            style={{ padding:'14px 16px', background:'rgba(232,228,216,0.08)', border:`1px solid ${error ? '#EF4444' : 'rgba(232,228,216,0.15)'}`, borderRadius:'var(--r)', color:'var(--cream)', fontSize:'0.95rem', outline:'none', fontFamily:'var(--font-body)' }}/>
          {error && <p style={{ fontSize:'0.78rem', color:'#EF4444', margin:'-8px 0 0' }}>Incorrect password</p>}
          <button type="submit" className="btn btn-bronze btn-full">Sign in</button>
        </form>
      </div>
    </div>
  )
}
