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

  // Tautan "Lowongan" hanya untuk pengunjung dan pencari kerja
  const showBrowse = !user || profile?.role === 'pencari_kerja'
  // Logo mengarah ke dashboard masing-masing untuk perusahaan dan admin
  const homeTo = (profile?.role === 'perusahaan' || profile?.role === 'admin') ? roleLink.to : '/'

  return (
    <nav className="nav-blur sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-5 h-14 flex items-center gap-6">

        {/* Logo */}
        <Link to={homeTo} className="flex items-center gap-0.5 font-bold text-lg shrink-0 tracking-tight">
          <span className="text-white">Kerjain</span>
          <span style={{ color: '#10b981' }}>.</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-1 flex-1">
          {showBrowse && (
            <Link to="/" className="px-3 py-1.5 text-sm font-medium text-neutral-500 hover:text-white rounded-lg hover:bg-white/5 transition-all">
              Lowongan
            </Link>
          )}
          {roleLink && (
            <Link to={roleLink.to} className="px-3 py-1.5 text-sm font-medium text-neutral-500 hover:text-white rounded-lg hover:bg-white/5 transition-all">
              {roleLink.label}
            </Link>
          )}
        </div>

        {/* Desktop auth */}
        <div className="hidden sm:flex items-center gap-3 ml-auto">
          {user ? (
            <>
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm text-white shrink-0"
                  style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  {profile?.nama?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="leading-none">
                  <p className="text-white text-sm font-medium">{profile?.nama}</p>
                  <p className="text-neutral-600 text-xs capitalize">{profile?.role?.replace('_', ' ')}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="text-sm font-medium text-neutral-500 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/5 transition-all"
              >
                Keluar
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-neutral-500 hover:text-white transition-colors px-3 py-1.5">
                Masuk
              </Link>
              <Link to="/register" className="btn-primary text-sm py-2 px-4">
                Daftar
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button className="sm:hidden ml-auto p-2 rounded-lg hover:bg-white/5" onClick={() => setMenuOpen(!menuOpen)}>
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            }
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="sm:hidden px-5 py-4 space-y-1 section-divider" style={{ background: 'rgba(10,10,10,0.98)' }}>
          {showBrowse && (
            <Link to="/" onClick={() => setMenuOpen(false)} className="block py-2.5 px-3 text-sm font-medium text-neutral-400 hover:text-white rounded-lg hover:bg-white/5">Lowongan</Link>
          )}
          {roleLink && (
            <Link to={roleLink.to} onClick={() => setMenuOpen(false)} className="block py-2.5 px-3 text-sm font-medium text-neutral-400 hover:text-white rounded-lg hover:bg-white/5">{roleLink.label}</Link>
          )}
          {user ? (
            <>
              <div className="flex items-center gap-3 px-3 py-2.5">
                <div className="w-7 h-7 rounded-full flex items-center justify-center font-semibold text-xs text-white" style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)' }}>
                  {profile?.nama?.charAt(0)?.toUpperCase()}
                </div>
                <p className="text-neutral-400 text-sm font-medium">{profile?.nama}</p>
              </div>
              <button onClick={handleLogout} className="w-full text-left py-2.5 px-3 text-sm font-medium text-red-400 hover:bg-red-500/10 rounded-lg">Keluar</button>
            </>
          ) : (
            <div className="flex gap-2 pt-2">
              <Link to="/login" onClick={() => setMenuOpen(false)} className="flex-1 text-center py-2.5 text-sm font-medium text-neutral-400 border rounded-lg" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>Masuk</Link>
              <Link to="/register" onClick={() => setMenuOpen(false)} className="flex-1 btn-primary text-sm text-center py-2.5">Daftar</Link>
            </div>
          )}
        </div>
      )}
    </nav>
  )
}