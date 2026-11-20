import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import StarRating from '../components/StarRating'

function Avatar({ name, size = 56 }) {
  return (
    <div style={{
      width: size, height: size, minWidth: size,
      borderRadius: '50%',
      background: 'var(--avatar-bg)',
      border: '1px solid var(--avatar-border)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 600, fontSize: size * 0.35, color: 'var(--avatar-text)',
    }}>
      {name?.charAt(0)?.toUpperCase() || '?'}
    </div>
  )
}

/* ── Report Modal ── */
function ReportModal({ jobId, userId, onClose, onReported }) {
  const reasons = ['Lowongan palsu', 'Meminta uang', 'Penipuan', 'Informasi tidak sesuai', 'Lainnya']
  const [alasan, setAlasan] = useState(reasons[0])
  const [detail, setDetail] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit() {
    setBusy(true); setError('')
    const { error: err } = await supabase.from('reports').insert({
      job_id: jobId, reporter_id: userId, alasan, detail: detail.trim() || null,
    })
    setBusy(false)
    if (err) {
      if (err.code === '23505') setError('Kamu sudah melaporkan lowongan ini.')
      else setError(err.message)
    } else {
      onReported()
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 px-4"
      style={{ background: 'var(--overlay)', backdropFilter: 'blur(8px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="card-elevated p-6 sm:p-8 max-w-md w-full fade-up">
        <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--text)' }}>Laporkan Lowongan</h2>
        <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>Pilih alasan pelaporan</p>

        {error && (
          <div className="text-sm p-3 rounded-lg mb-4 font-medium"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', color: '#f87171' }}>{error}</div>
        )}

        <div className="space-y-2 mb-4">
          {reasons.map(r => (
            <label key={r} className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all"
              style={{ background: alasan === r ? 'var(--accent-soft)' : 'var(--tag-bg)', border: `1px solid ${alasan === r ? 'var(--accent-border)' : 'var(--border)'}` }}>
              <input type="radio" name="alasan" checked={alasan === r} onChange={() => setAlasan(r)} className="hidden" />
              <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0"
                style={{ borderColor: alasan === r ? 'var(--accent)' : 'var(--muted)' }}>
                {alasan === r && <div className="w-2 h-2 rounded-full" style={{ background: 'var(--accent)' }} />}
              </div>
              <span className="text-sm font-medium" style={{ color: alasan === r ? 'var(--accent)' : 'var(--text-secondary)' }}>{r}</span>
            </label>
          ))}
        </div>

        <textarea className="input-dark resize-none text-sm" rows={3} placeholder="Detail tambahan (opsional)..."
          value={detail} onChange={e => setDetail(e.target.value)} />

        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="btn-ghost flex-1 py-3 text-sm">Batal</button>
          <button onClick={submit} disabled={busy}
            className="flex-1 py-3 text-sm font-semibold rounded-xl transition-all disabled:opacity-40"
            style={{ background: '#ef4444', color: '#fff' }}>
            {busy ? 'Mengirim...' : 'Kirim Laporan'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function JobDetail() {
  const { id } = useParams()
  const { user, profile } = useAuth()
  const [job, setJob] = useState(null)
  const [msg, setMsg] = useState('')
  const [applied, setApplied] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [reported, setReported] = useState(false)
  const [companyRating, setCompanyRating] = useState({ avg: 0, count: 0 })

  useEffect(() => {
    supabase.from('jobs').select('*, companies(id, nama, deskripsi)').eq('id', id).single()
      .then(({ data }) => {
        setJob(data)
        if (data?.companies?.id) {
          supabase.from('company_rating_summary').select('*').eq('company_id', data.companies.id).maybeSingle()
            .then(({ data: rs }) => { if (rs) setCompanyRating({ avg: rs.rata2 || 0, count: rs.jumlah || 0 }) })
        }
      })
    // Check if already reported
    if (user) {
      supabase.from('reports').select('id').eq('job_id', id).eq('reporter_id', user.id).maybeSingle()
        .then(({ data }) => { if (data) setReported(true) })
    }
  }, [id, user?.id])

  async function apply() {
    setMsg('')
    const { error } = await supabase.from('applications').insert({ job_id: id, user_id: user.id })
    if (error) {
      setMsg(error.code === '23505' ? 'Kamu sudah melamar lowongan ini.' : error.message)
    } else {
      setApplied(true)
      setMsg('Lamaran berhasil terkirim! Pantau status di menu Lamaran Saya.')
    }
  }

  if (!job) return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="text-center">
        <div className="relative w-12 h-12 mx-auto mb-4"><div className="loading-ring" /></div>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>Memuat detail lowongan...</p>
      </div>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      {/* Back */}
      <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium mb-8 transition-colors group"
        style={{ color: 'var(--muted)' }}>
        <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Kembali
      </Link>

      <div className="space-y-4">
        {/* Header Card */}
        <div className="card-elevated p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row gap-5 items-start">
            <Avatar name={job.companies?.nama} size={64} />
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl font-bold leading-tight tracking-tight" style={{ color: 'var(--text)' }}>{job.judul}</h1>
              <p className="font-medium mt-1" style={{ color: 'var(--text-secondary)' }}>{job.companies?.nama}</p>

              {/* Company rating */}
              {companyRating.count > 0 && (
                <div className="mt-2">
                  <StarRating value={companyRating.avg} readOnly size={14} showValue count={companyRating.count} />
                </div>
              )}
              {companyRating.count === 0 && (
                <p className="text-xs mt-2" style={{ color: 'var(--muted)' }}>Belum ada rating</p>
              )}

              <div className="flex flex-wrap gap-2 mt-4">
                {job.lokasi && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg"
                    style={{ background: 'var(--tag-bg)', border: '1px solid var(--tag-border)', color: 'var(--tag-text)' }}>
                    📍 {job.lokasi}
                  </span>
                )}
                {job.kategori && (
                  <span className="text-xs font-medium px-3 py-1.5 rounded-lg"
                    style={{ background: 'var(--tag-bg)', border: '1px solid var(--tag-border)', color: 'var(--tag-text)' }}>
                    {job.kategori}
                  </span>
                )}
                <span className="text-xs font-medium px-3 py-1.5 rounded-lg"
                  style={{ background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', color: 'var(--accent)' }}>
                  Full-time
                </span>
              </div>
            </div>
            {job.gaji && (
              <div className="shrink-0 text-center sm:text-right">
                <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted)' }}>GAJI / BULAN</p>
                <p className="text-xl font-bold" style={{ color: 'var(--accent)' }}>
                  Rp {Number(job.gaji).toLocaleString('id-ID')}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          {/* Deskripsi */}
          <div className="sm:col-span-2 card p-6">
            <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--text)' }}>Deskripsi Pekerjaan</h2>
            <div className="text-sm leading-7 whitespace-pre-line" style={{ color: 'var(--text-secondary)' }}>
              {job.deskripsi || 'Tidak ada deskripsi tersedia.'}
            </div>
          </div>

          {/* Side panel */}
          <div className="space-y-4">
            {job.companies?.deskripsi && (
              <div className="card p-5">
                <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text)' }}>🏢 {job.companies.nama}</h2>
                <p className="text-xs leading-6" style={{ color: 'var(--muted)' }}>{job.companies.deskripsi}</p>
              </div>
            )}
            <div className="card p-5 space-y-3">
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Info Lowongan</h2>
              {[
                { label: 'Lokasi', value: job.lokasi || '-' },
                { label: 'Kategori', value: job.kategori || '-' },
                { label: 'Gaji', value: job.gaji ? `Rp ${Number(job.gaji).toLocaleString('id-ID')}` : 'Negosiasi' },
                { label: 'Tipe', value: 'Full-time' },
              ].map(i => (
                <div key={i.label} className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: 'var(--muted)' }}>{i.label}</span>
                  <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{i.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="card p-5">
          {msg && (
            <div className={`flex items-start gap-3 p-4 rounded-xl text-sm font-medium mb-4`}
              style={{
                background: applied ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                border: `1px solid ${applied ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
                color: applied ? 'var(--accent)' : '#f87171',
              }}>
              <span>{applied ? '✓' : '!'}</span>
              <p>{msg}</p>
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-3">
            {!user && (
              <Link to="/login" className="btn-primary flex-1 text-center py-3 text-sm">Masuk untuk Melamar</Link>
            )}
            {profile?.role === 'pencari_kerja' && (
              <>
                <button onClick={apply} disabled={applied}
                  className={`flex-1 font-semibold py-3 rounded-xl text-sm transition-all ${applied ? '' : 'btn-accent'}`}
                  style={applied ? { background: 'var(--surface)', color: 'var(--muted)', border: '1px solid var(--border)', cursor: 'not-allowed' } : {}}>
                  {applied ? '✓ Sudah Melamar' : 'Lamar Sekarang'}
                </button>
                {/* Report button */}
                <button
                  onClick={() => reported ? null : setShowReport(true)}
                  disabled={reported}
                  className="text-xs font-medium py-3 px-4 rounded-xl transition-all disabled:cursor-not-allowed"
                  style={{
                    background: reported ? 'var(--tag-bg)' : 'rgba(239,68,68,0.06)',
                    border: `1px solid ${reported ? 'var(--border)' : 'rgba(239,68,68,0.15)'}`,
                    color: reported ? 'var(--muted)' : '#f87171',
                  }}>
                  {reported ? '⚑ Sudah Dilaporkan' : '⚑ Laporkan'}
                </button>
              </>
            )}
            <Link to="/" className="btn-ghost flex-1 text-center py-3 text-sm">← Lowongan Lain</Link>
          </div>
        </div>
      </div>

      {/* Report Modal */}
      {showReport && (
        <ReportModal jobId={id} userId={user.id}
          onClose={() => setShowReport(false)}
          onReported={() => { setShowReport(false); setReported(true) }} />
      )}
    </div>
  )
}
