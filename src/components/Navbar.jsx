import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState } from 'react'

export default function Navbar() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleLogout() {
    await signOut()
    navigate('/')
    setMenuOpen(false)
  }

  const roleLink = profile?.role === 'pencari_kerja'
    ? { to: '/lamaran', label: 'Lamaran Saya' }
    : profile?.role === 'perusahaan'
    ? { to: '/perusahaan', label: 'Dashboard' }
    : profile?.role === 'admin'
    ? { to: '/admin', label: 'Admin Panel' }
    : null

  return (
    <nav className="nav-blur sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-5 py-3.5 flex items-center gap-6">

  
        <Link to="/" className="flex items-center gap-1 font-black text-xl shrink-0">
          <span style={{ background: 'linear-gradient(135deg,#a855f7,#7c3aed)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Kerja</span>
          <span style={{ background: 'linear-gradient(135deg,#06d6a0,#00f5c4)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>in</span>
          <span className="text-white">.</span>
        </Link>

        <div className="hidden sm:flex items-center gap-1 flex-1">
          <Link to="/" className="px-4 py-2 text-sm font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition-all">
            Lowongan
          </Link>
          {roleLink && (
            <Link to={roleLink.to} className="px-4 py-2 text-sm font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition-all">
              {roleLink.label}
            </Link>
          )}
        </div>

     
        <div className="hidden sm:flex items-center gap-3 ml-auto">
          {user ? (
            <>
              <div className="flex items-center gap-2.5">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm text-white shrink-0"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #06d6a0)' }}
                >
                  {profile?.nama?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="leading-none">
                  <p className="text-white text-sm font-bold">{profile?.nama}</p>
                  <p className="text-slate-500 text-xs capitalize">{profile?.role?.replace('_', ' ')}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="btn-ghost text-sm py-2 px-4"
                style={{ borderRadius: 12 }}
              >
                Keluar
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm font-semibold text-slate-400 hover:text-white transition-colors px-4 py-2">
                Masuk
              </Link>
              <Link to="/register" className="btn-primary text-sm py-2.5 px-5">
                Daftar Gratis
              </Link>
            </>
          )}
        </div>

      
        <button className="sm:hidden ml-auto p-2 rounded-xl hover:bg-white/5" onClick={() => setMenuOpen(!menuOpen)}>
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            }
          </svg>
        </button>
      </div>

    
      {menuOpen && (
        <div className="sm:hidden border-t px-5 py-4 space-y-2" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(7,8,15,0.97)' }}>
          <Link to="/" onClick={() => setMenuOpen(false)} className="block py-2.5 px-4 text-sm font-semibold text-slate-300 hover:text-white rounded-xl hover:bg-white/5">Lowongan</Link>
          {roleLink && (
            <Link to={roleLink.to} onClick={() => setMenuOpen(false)} className="block py-2.5 px-4 text-sm font-semibold text-slate-300 hover:text-white rounded-xl hover:bg-white/5">{roleLink.label}</Link>
          )}
          {user ? (
            <>
              <div className="flex items-center gap-3 px-4 py-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm text-white" style={{ background: 'linear-gradient(135deg,#7c3aed,#06d6a0)' }}>
                  {profile?.nama?.charAt(0)?.toUpperCase()}
                </div>
                <p className="text-slate-300 text-sm font-semibold">{profile?.nama}</p>
              </div>
              <button onClick={handleLogout} className="w-full text-left py-2.5 px-4 text-sm font-semibold text-red-400 hover:bg-red-500/10 rounded-xl">Keluar</button>
            </>
          ) : (
            <div className="flex gap-2 pt-1">
              <Link to="/login" onClick={() => setMenuOpen(false)} className="flex-1 text-center py-2.5 text-sm font-semibold text-slate-300 border rounded-xl" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>Masuk</Link>
              <Link to="/register" onClick={() => setMenuOpen(false)} className="flex-1 btn-primary text-sm text-center py-2.5">Daftar</Link>
            </div>
          )}
        </div>
      )}
    </nav>
  )
}
