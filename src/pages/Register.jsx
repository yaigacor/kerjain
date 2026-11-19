import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ nama: '', email: '', password: '', role: 'pencari_kerja' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  async function handleSubmit(e) {
    e.preventDefault()
    setBusy(true); setError('')
    const { error } = await signUp(form.email, form.password, form.nama, form.role)
    setBusy(false)
    if (error) setError(error.message)
    else navigate('/')
  }

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center px-4 py-10 relative">
      {/* Subtle glow */}
      <div style={{
        position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
        width: '600px', height: '400px', borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(16,185,129,0.04) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div className="w-full max-w-sm relative fade-up">
        <div className="card-elevated p-8">
          {/* Logo */}
          <div className="text-center mb-7">
            <Link to="/" className="inline-block font-bold text-xl tracking-tight">
              <span className="text-white">Kerjain</span>
              <span style={{ color: '#10b981' }}>.</span>
            </Link>
            <h1 className="text-lg font-bold text-white mt-4">Buat Akun Baru</h1>
            <p className="text-neutral-600 text-sm mt-1">Mulai perjalanan kariermu</p>
          </div>

          {/* Role Toggle */}
          <div className="flex p-1 rounded-xl mb-6" style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.06)' }}>
            {[
              { key: 'pencari_kerja', label: 'Pencari Kerja' },
              { key: 'perusahaan', label: 'Perusahaan' },
            ].map(opt => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setForm({ ...form, role: opt.key })}
                className="flex-1 py-2 text-sm font-medium rounded-lg transition-all"
                style={form.role === opt.key
                  ? { background: 'rgba(255,255,255,0.08)', color: '#f5f5f5', border: '1px solid rgba(255,255,255,0.1)' }
                  : { color: '#525252', border: '1px solid transparent' }
                }
              >
                {opt.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-start gap-2 p-3 rounded-lg text-sm font-medium"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
                <span className="shrink-0 mt-0.5">!</span>
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-2">
                {form.role === 'perusahaan' ? 'Nama PIC' : 'Nama Lengkap'}
              </label>
              <input className="input-dark" placeholder={form.role === 'perusahaan' ? 'Nama perwakilan' : 'Nama lengkapmu'} value={form.nama} onChange={set('nama')} required />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-2">Email</label>
              <input className="input-dark" type="email" placeholder="nama@email.com" value={form.email} onChange={set('email')} required />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-2">Password</label>
              <div className="relative">
                <input className="input-dark" style={{ paddingRight: 44 }} type={showPass ? 'text' : 'password'} placeholder="Min. 6 karakter" minLength={6} value={form.password} onChange={set('password')} required />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-neutral-400 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {showPass
                      ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      : <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>
                    }
                  </svg>
                </button>
              </div>
            </div>

            <button
              disabled={busy}
              className="btn-accent w-full mt-2 flex items-center justify-center gap-2"
              style={{ padding: '12px' }}
            >
              {busy ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Memproses...
                </>
              ) : 'Buat Akun'}
            </button>
          </form>

          <p className="text-center text-neutral-600 text-sm mt-6">
            Sudah punya akun?{' '}
            <Link to="/login" className="font-semibold text-white hover:text-emerald-400 transition-colors">Masuk</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
