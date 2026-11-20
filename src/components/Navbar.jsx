import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

/* ── Theme helpers ── */
function getTheme() {
  try {
    return localStorage.getItem('kerjain-theme') || (window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
  } catch { return 'dark' }
}
function setTheme(t) {
  try { localStorage.setItem('kerjain-theme', t) } catch {}
  document.documentElement.setAttribute('data-theme', t)
}

/* ── Sun / Moon icons ── */
function SunIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  )
}
function MoonIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  )
}

/* ── Bell Icon ── */
function BellIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  )
}

/* ── Notification Dropdown ── */
function NotificationDropdown({ user, onToast }) {
  const [open, setOpen] = useState(false)
  const [notifs, setNotifs] = useState([])
  const [unread, setUnread] = useState(0)
  const ref = useRef(null)

  async function load() {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)
    setNotifs(data || [])
    const count = (data || []).filter(n => !n.dibaca).length
    setUnread(count)
  }

  useEffect(() => {
    if (!user) return
    load()

    const channel = supabase
      .channel(`notif-${user.id}-${Math.random().toString(36).slice(2)}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          setNotifs(prev => [payload.new, ...prev].slice(0, 10))
          setUnread(prev => prev + 1)
          onToast?.(payload.new.judul || 'Notifikasi baru')
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user?.id])

  // Close on outside click
  useEffect(() => {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  async function markRead(id) {
    await supabase.from('notifications').update({ dibaca: true }).eq('id', id)
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, dibaca: true } : n))
    setUnread(prev => Math.max(0, prev - 1))
  }

  async function markAllRead() {
    await supabase.from('notifications').update({ dibaca: true }).eq('user_id', user.id).eq('dibaca', false)
    setNotifs(prev => prev.map(n => ({ ...n, dibaca: true })))
    setUnread(0)
  }

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="relative p-2 rounded-lg transition-all"
        style={{ color: 'var(--text-secondary)' }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--tag-bg)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
        <BellIcon />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center text-white"
            style={{ background: '#ef4444', fontSize: 9 }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 max-w-[90vw] max-h-96 overflow-y-auto rounded-xl shadow-xl z-50 fade-up"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between p-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Notifikasi</p>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-[11px] font-medium" style={{ color: 'var(--accent)' }}>
                Tandai semua dibaca
              </button>
            )}
          </div>
          {notifs.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-xs" style={{ color: 'var(--muted)' }}>Belum ada notifikasi</p>
            </div>
          ) : (
            notifs.map(n => (
              <Link
                key={n.id}
                to={n.link || '#'}
                onClick={() => { markRead(n.id); setOpen(false) }}
                className="block p-3 transition-colors"
                style={{
                  borderBottom: '1px solid var(--border)',
                  background: n.dibaca ? 'transparent' : 'var(--accent-soft)',
                }}
              >
                <p className="text-xs font-semibold" style={{ color: 'var(--text)' }}>{n.judul}</p>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>{n.isi}</p>
                <p className="text-[10px] mt-1" style={{ color: 'var(--muted)' }}>
                  {new Date(n.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════
   NAVBAR
   ══════════════════════════════════════════ */
export default function Navbar() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [theme, setThemeState] = useState(getTheme)
  const [toast, setToast] = useState('')

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setThemeState(next)
    setTheme(next)
  }

  async function handleLogout() {
    await signOut()
    navigate('/')
    setMenuOpen(false)
  }

  const navLinks = []
  if (profile?.role === 'pencari_kerja') {
    navLinks.push({ to: '/profil', label: 'Profil' })
    navLinks.push({ to: '/lamaran', label: 'Lamaran Saya' })
  } else if (profile?.role === 'perusahaan') {
    navLinks.push({ to: '/perusahaan', label: 'Dashboard' })
  } else if (profile?.role === 'admin') {
    navLinks.push({ to: '/admin', label: 'Admin Panel' })
  }

  return (
    <>
      {/* Toast from notification */}
      {toast && (
        <div className="fixed top-16 right-4 z-[100] max-w-sm fade-up">
          <div className="flex items-center gap-3 p-3 rounded-xl text-sm font-medium shadow-lg"
            style={{ background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', color: 'var(--accent)' }}>
            <span>🔔</span>
            <p className="flex-1 text-xs">{toast}</p>
            <button onClick={() => setToast('')} style={{ color: 'var(--muted)' }}>✕</button>
          </div>
        </div>
      )}

      <nav className="nav-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-5 h-14 flex items-center gap-4 sm:gap-6">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-0.5 font-bold text-lg shrink-0 tracking-tight">
            <span style={{ color: 'var(--text)' }}>Kerjain</span>
            <span style={{ color: 'var(--accent)' }}>.</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden sm:flex items-center gap-1 flex-1">
            {navLinks.map(link => (
              <Link key={link.to} to={link.to}
                className="px-3 py-1.5 text-sm font-medium rounded-lg transition-all"
                style={{ color: 'var(--text-secondary)' }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.background = 'var(--tag-bg)' }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent' }}>
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop right side */}
          <div className="hidden sm:flex items-center gap-2 ml-auto">
            {/* Theme toggle */}
            <button onClick={toggleTheme} className="p-2 rounded-lg transition-all"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--tag-bg)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>

            {/* Notification bell */}
            {user && <NotificationDropdown user={user} onToast={msg => { setToast(msg); setTimeout(() => setToast(''), 4000) }} />}

            {user ? (
              <>
                <div className="flex items-center gap-2.5 ml-1">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm shrink-0"
                    style={{ background: 'var(--avatar-bg)', border: '1px solid var(--avatar-border)', color: 'var(--avatar-text)' }}>
                    {profile?.nama?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div className="leading-none">
                    <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{profile?.nama}</p>
                    <p className="text-xs capitalize" style={{ color: 'var(--muted)' }}>{profile?.role?.replace('_', ' ')}</p>
                  </div>
                </div>
                <button onClick={handleLogout}
                  className="text-sm font-medium px-3 py-1.5 rounded-lg transition-all"
                  style={{ color: 'var(--text-secondary)' }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.background = 'var(--tag-bg)' }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent' }}>
                  Keluar
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium transition-colors px-3 py-1.5"
                  style={{ color: 'var(--text-secondary)' }}>
                  Masuk
                </Link>
                <Link to="/register" className="btn-primary text-sm py-2 px-4">
                  Daftar
                </Link>
              </>
            )}
          </div>

          {/* Mobile right side */}
          <div className="sm:hidden flex items-center gap-1 ml-auto">
            <button onClick={toggleTheme} className="p-2 rounded-lg" style={{ color: 'var(--text-secondary)' }}>
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>
            {user && <NotificationDropdown user={user} onToast={msg => { setToast(msg); setTimeout(() => setToast(''), 4000) }} />}
            <button className="p-2 -mr-1 rounded-lg" style={{ color: 'var(--text)' }}
              onClick={() => setMenuOpen(!menuOpen)}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {menuOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                }
              </svg>
            </button>
          </div>
        </div>

      </nav>

      {/* Mobile menu — di luar nav agar fixed tidak terjebak backdrop-filter */}
      {menuOpen && (
        <div className="sm:hidden fixed inset-0 top-14 z-40" style={{ background: 'var(--bg)' }}>
          <div className="px-4 py-6 space-y-1 h-full flex flex-col">
            {navLinks.map(link => (
              <Link key={link.to} to={link.to} onClick={() => setMenuOpen(false)}
                className="block py-3 px-4 text-base font-medium rounded-xl transition-all"
                style={{ color: 'var(--text-secondary)' }}>
                {link.label}
              </Link>
            ))}

            <div className="flex-1" />

            {user ? (
              <div className="space-y-3 pb-6">
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: 'var(--surface)' }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm"
                    style={{ background: 'var(--avatar-bg)', border: '1px solid var(--avatar-border)', color: 'var(--avatar-text)' }}>
                    {profile?.nama?.charAt(0)?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{profile?.nama}</p>
                    <p className="text-xs capitalize" style={{ color: 'var(--muted)' }}>{profile?.role?.replace('_', ' ')}</p>
                  </div>
                </div>
                <button onClick={handleLogout} className="w-full py-3 px-4 text-base font-medium text-red-400 hover:bg-red-500/10 rounded-xl text-left transition-all">
                  Keluar
                </button>
              </div>
            ) : (
              <div className="space-y-2 pb-6">
                <Link to="/login" onClick={() => setMenuOpen(false)}
                  className="block w-full text-center py-3 text-sm font-medium rounded-xl transition-all"
                  style={{ color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                  Masuk
                </Link>
                <Link to="/register" onClick={() => setMenuOpen(false)}
                  className="block w-full btn-primary text-sm text-center py-3">
                  Daftar
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}