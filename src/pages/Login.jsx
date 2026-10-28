import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [showPass, setShowPass] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setBusy(true); setError('')
    const { error } = await signIn(email, password)
    setBusy(false)
    if (error) setError(error.message)
    else navigate('/')
  }

  return (
    <div className="min-h-[calc(100vh-60px)] flex items-center justify-center px-4 py-10 relative overflow-hidden">
      {/* BG orbs */}
      <div style={{ position:'absolute', top:-200, left:-200, width:600, height:600, borderRadius:'50%', background:'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', bottom:-200, right:-200, width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle, rgba(6,214,160,0.1) 0%, transparent 70%)', pointerEvents:'none' }} />
      <div className="grid-pattern absolute inset-0 opacity-20" />

      <div className="w-full max-w-md relative fade-up">
        {/* Card */}
        <div className="glass-strong rounded-3xl p-8 sm:p-10" style={{ boxShadow:'0 30px 80px rgba(0,0,0,0.5)' }}>
          {/* Logo */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-1 font-black text-2xl">
              <span style={{ background:'linear-gradient(135deg,#a855f7,#7c3aed)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Kerja</span>
              <span style={{ background:'linear-gradient(135deg,#06d6a0,#00f5c4)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>in</span>
              <span className="text-white">.</span>
            </Link>
            <h1 className="text-xl font-black text-white mt-5">Selamat Datang Kembali!</h1>
            <p className="text-slate-500 text-sm mt-1.5">Masuk dan lanjutkan perjalanan kariermu</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error */}
            {error && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl text-sm font-medium"
                style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.25)', color:'#fca5a5' }}>
                <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Email</label>
              <input className="input-dark" type="email" placeholder="nama@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Password</label>
              <div className="relative">
                <input className="input-dark" style={{ paddingRight: 48 }} type={showPass ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                  {showPass
                    ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  }
                </button>
              </div>
            </div>

            <button
              disabled={busy}
              className="btn-primary w-full mt-2 flex items-center justify-center gap-2"
              style={{ padding:'14px', borderRadius:14 }}
            >
              {busy ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Memproses...
                </>
              ) : 'Masuk ke Akun →'}
            </button>
          </form>

          <p className="text-center text-slate-500 text-sm mt-6">
            Belum punya akun?{' '}
            <Link to="/register" className="font-black" style={{ color:'#a78bfa' }}>Daftar Gratis</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
