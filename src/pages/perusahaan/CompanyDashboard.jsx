import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

/* ── Reusable Input ── */
function InputField({ label, textarea, ...props }) {
  if (textarea) return (
    <div>
      {label && <label className="block text-xs font-medium text-neutral-500 mb-2">{label}</label>}
      <textarea className="input-dark resize-none" rows={4} {...props} />
    </div>
  )
  return (
    <div>
      {label && <label className="block text-xs font-medium text-neutral-500 mb-2">{label}</label>}
      <input className="input-dark" {...props} />
    </div>
  )
}

/* ── Status badge helpers ── */
const APP_STATUS = {
  dikirim:   { color: '#737373', label: 'Dikirim', dot: '#525252' },
  dilihat:   { color: '#fbbf24', label: 'Dilihat', dot: '#fbbf24' },
  wawancara: { color: '#60a5fa', label: 'Wawancara', dot: '#60a5fa' },
  diterima:  { color: '#10b981', label: 'Diterima', dot: '#10b981' },
  ditolak:   { color: '#f87171', label: 'Ditolak', dot: '#f87171' },
}

/* ── Buka CV (bucket private, jadi pakai signed URL sementara) ── */
async function openCv(cvUrl) {
  // cvUrl bisa berupa path (uid/file.pdf) atau link lama dari getPublicUrl
  const path = cvUrl.includes('/cv/') ? cvUrl.split('/cv/').pop() : cvUrl
  const w = window.open('', '_blank') // dibuka dulu agar tidak diblokir popup
  const { data, error } = await supabase.storage.from('cv').createSignedUrl(path, 60)
  if (error || !data?.signedUrl) {
    w?.close()
    alert('CV tidak bisa dibuka: ' + (error?.message || 'file tidak ditemukan'))
    return
  }
  if (w) w.location.href = data.signedUrl
  else window.location.href = data.signedUrl
}

/* ── Applicant Card ── */
function ApplicantCard({ app, onUpdateStatus }) {
  const cfg = APP_STATUS[app.status] || APP_STATUS.dikirim
  const [open, setOpen] = useState(false)

  return (
    <div className="p-3 sm:p-4 rounded-xl transition-all"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm shrink-0"
          style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)', color: '#a3a3a3' }}>
          {app.profiles?.nama?.charAt(0)?.toUpperCase() || '?'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-white text-sm truncate">{app.profiles?.nama || 'Pelamar'}</p>
          <p className="text-xs text-neutral-600 truncate">
            Melamar {new Date(app.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {app.profiles?.cv_url && (
            <button type="button" onClick={() => openCv(app.profiles.cv_url)}
              className="text-xs font-medium px-2.5 py-1.5 rounded-lg transition-all hidden sm:flex items-center gap-1"
              style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', color: '#60a5fa' }}>
              📄 CV
            </button>
          )}
          <button onClick={() => setOpen(!open)}
            className="text-xs font-medium px-2.5 py-1.5 rounded-lg flex items-center gap-1"
            style={{ background: `${cfg.color}15`, border: `1px solid ${cfg.color}30`, color: cfg.color }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
            {cfg.label}
            <svg className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile CV link */}
      {app.profiles?.cv_url && (
        <button type="button" onClick={() => openCv(app.profiles.cv_url)}
          className="sm:hidden mt-2 text-xs font-medium px-2.5 py-1.5 rounded-lg inline-flex items-center gap-1"
          style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', color: '#60a5fa' }}>
          📄 Lihat CV
        </button>
      )}

      {/* Status changer dropdown */}
      {open && (
        <div className="mt-3 pt-3 flex flex-wrap gap-1.5 fade-up" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <span className="text-[10px] text-neutral-600 font-medium self-center mr-1">Ubah status:</span>
          {Object.entries(APP_STATUS).map(([key, s]) => (
            <button key={key}
              onClick={() => { onUpdateStatus(app.id, key); setOpen(false) }}
              disabled={app.status === key}
              className="text-[11px] font-medium px-2.5 py-1 rounded-md transition-all disabled:opacity-30"
              style={{ background: `${s.color}10`, border: `1px solid ${s.color}25`, color: s.color }}>
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Job Card with Applicants ── */
function JobWithApplicants({ job, onClose, onUpdateAppStatus }) {
  const [apps, setApps] = useState([])
  const [loadingApps, setLoadingApps] = useState(false)
  const [expanded, setExpanded] = useState(false)

  async function loadApps() {
    if (apps.length > 0) { setExpanded(!expanded); return }
    setLoadingApps(true)
    const { data } = await supabase
      .from('applications')
      .select('id, status, created_at, user_id, profiles(nama, cv_url)')
      .eq('job_id', job.id)
      .order('created_at', { ascending: false })
    setApps(data || [])
    setLoadingApps(false)
    setExpanded(true)
  }

  async function changeStatus(appId, status) {
    const { error } = await onUpdateAppStatus(appId, status)
    if (error) { alert('Gagal mengubah status: ' + error.message); return }
    setApps(prev => prev.map(a => (a.id === appId ? { ...a, status } : a)))
  }

  const appCount = apps.length

  return (
    <div className="card overflow-hidden">
      {/* Job header */}
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-white text-sm">{job.judul}</p>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-md"
                style={job.status === 'open'
                  ? { background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }
                  : { background: 'rgba(255,255,255,0.03)', color: '#525252', border: '1px solid rgba(255,255,255,0.06)' }
                }>
                {job.status === 'open' ? '● Aktif' : '● Ditutup'}
              </span>
            </div>
            <p className="text-xs text-neutral-600 mt-1">
              {job.lokasi && <span> {job.lokasi}</span>}
              {job.kategori && <span> · {job.kategori}</span>}
              {job.gaji && <span> · Rp {Number(job.gaji).toLocaleString('id-ID')}</span>}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {job.status === 'open' && (
              <button onClick={() => onClose(job.id)}
                className="text-xs font-medium px-2.5 py-1.5 rounded-lg transition-all hidden sm:block"
                style={{ border: '1px solid rgba(239,68,68,0.15)', color: '#f87171', background: 'rgba(239,68,68,0.05)' }}>
                Tutup
              </button>
            )}
          </div>
        </div>

        {/* Action bar */}
        <div className="flex items-center gap-2 mt-3">
          <button onClick={loadApps}
            className="text-xs font-medium px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#a3a3a3' }}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {loadingApps ? 'Memuat...' : expanded ? 'Tutup Pelamar' : `Lihat Pelamar${appCount > 0 ? ` (${appCount})` : ''}`}
          </button>
          {job.status === 'open' && (
            <button onClick={() => onClose(job.id)}
              className="sm:hidden text-xs font-medium px-2.5 py-1.5 rounded-lg transition-all"
              style={{ border: '1px solid rgba(239,68,68,0.15)', color: '#f87171', background: 'rgba(239,68,68,0.05)' }}>
              Tutup Lowongan
            </button>
          )}
        </div>
      </div>

      {/* Applicants list */}
      {expanded && (
        <div className="px-4 sm:px-5 pb-4 sm:pb-5 space-y-2 fade-up" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="pt-3">
            {apps.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-neutral-600 text-xs font-medium">Belum ada pelamar untuk lowongan ini</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-[11px] font-medium text-neutral-600 uppercase tracking-wider mb-2">
                  {apps.length} Pelamar
                </p>
                {apps.map(a => (
                  <ApplicantCard key={a.id} app={a} onUpdateStatus={changeStatus} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Create Job Modal ── */
function CreateJobModal({ companyId, onClose, onCreated }) {
  const [form, setForm] = useState({ judul: '', deskripsi: '', lokasi: '', kategori: '', gaji: '' })
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setMsg('')
    const payload = { ...form, company_id: companyId, gaji: form.gaji ? Number(form.gaji) : null }
    const { error } = await supabase.from('jobs').insert(payload)
    setBusy(false)
    if (error) { setMsg(error.message) }
    else { onCreated() }
  }

  return (
    <div className="fixed inset-0 flex items-end sm:items-center justify-center z-50 px-0 sm:px-4"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="card-elevated w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl rounded-b-none sm:rounded-b-2xl p-6 sm:p-8 fade-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white">Pasang Lowongan Baru</h2>
          <button onClick={onClose} className="text-neutral-600 hover:text-white transition-colors p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {msg && (
          <div className="text-red-400 text-sm p-3 rounded-lg mb-4"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>{msg}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <InputField label="Judul Posisi *" placeholder="contoh: Senior UI/UX Designer" value={form.judul}
            onChange={e => setForm({ ...form, judul: e.target.value })} required />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <InputField label="Lokasi" placeholder="Jakarta" value={form.lokasi}
              onChange={e => setForm({ ...form, lokasi: e.target.value })} />
            <InputField label="Kategori" placeholder="Technology" value={form.kategori}
              onChange={e => setForm({ ...form, kategori: e.target.value })} />
            <InputField label="Gaji (Rp)" type="number" placeholder="5000000" value={form.gaji}
              onChange={e => setForm({ ...form, gaji: e.target.value })} />
          </div>

          <InputField textarea label="Deskripsi Pekerjaan" placeholder="Tanggung jawab, kualifikasi, benefit..."
            value={form.deskripsi} onChange={e => setForm({ ...form, deskripsi: e.target.value })} />

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost flex-1 py-3 text-sm">Batal</button>
            <button type="submit" disabled={busy} className="btn-accent flex-1 py-3 text-sm font-semibold">
              {busy ? 'Menyimpan...' : 'Pasang Lowongan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════ */
export default function CompanyDashboard() {
  const { user } = useAuth()
  const [company, setCompany] = useState(null)
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [cForm, setCForm] = useState({ nama: '', deskripsi: '', alamat: '' })
  const [msg, setMsg] = useState('')
  const [showCreateJob, setShowCreateJob] = useState(false)
  const [activeSection, setActiveSection] = useState('lowongan')

  async function load() {
    const { data: c } = await supabase
      .from('companies')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    setCompany(c)
    if (c) {
      const { data: j } = await supabase.from('jobs').select('*, applications(count)').eq('company_id', c.id).order('created_at', { ascending: false })
      setJobs(j || [])
    }
    setLoading(false)
  }
  // Muat saat dibuka, dan muat ulang setiap kali kembali ke tab ini
  // (supaya status "Menunggu Verifikasi" berubah setelah admin menyetujui)
  useEffect(() => {
    load()
    const onFocus = () => load()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])

  async function createCompany(e) {
    e.preventDefault()
    setMsg('')
    const { error } = await supabase.from('companies').insert({ ...cForm, owner_id: user.id })
    if (error) setMsg(error.message); else load()
  }

  async function closeJob(id) {
    await supabase.from('jobs').update({ status: 'closed' }).eq('id', id)
    load()
  }

  async function updateAppStatus(appId, status) {
    return await supabase.from('applications').update({ status }).eq('id', appId)
  }

  /* ── Loading ── */
  if (loading) return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="text-center">
        <div className="relative w-12 h-12 mx-auto mb-4"><div className="loading-ring" /></div>
        <p className="text-neutral-600 text-sm">Memuat dashboard...</p>
      </div>
    </div>
  )

  /* ══════════════════════════════
     STATE 1: Belum punya perusahaan
     ══════════════════════════════ */
  if (!company) return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <div className="card-elevated p-6 sm:p-8">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.08)' }}>
            <span className="text-2xl">🏢</span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-white">Daftarkan Perusahaanmu</h1>
          <p className="text-neutral-600 text-xs sm:text-sm mt-2">Lengkapi profil untuk mulai memasang lowongan</p>
        </div>
        {msg && <div className="text-red-400 text-sm p-3 rounded-lg mb-4" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>{msg}</div>}
        <form onSubmit={createCompany} className="space-y-4">
          <InputField label="Nama Perusahaan" placeholder="PT. Contoh Indonesia" value={cForm.nama} onChange={e => setCForm({ ...cForm, nama: e.target.value })} required />
          <InputField label="Alamat" placeholder="Jl. Sudirman No.1, Jakarta" value={cForm.alamat} onChange={e => setCForm({ ...cForm, alamat: e.target.value })} />
          <InputField textarea label="Deskripsi" placeholder="Ceritakan tentang perusahaanmu..." value={cForm.deskripsi} onChange={e => setCForm({ ...cForm, deskripsi: e.target.value })} />
          <button className="btn-accent w-full py-3 text-sm">Daftarkan Perusahaan</button>
        </form>
      </div>
    </div>
  )

  /* ══════════════════════════════
     STATE 2: Pending — Menunggu verifikasi
     ══════════════════════════════ */
  if (company.status === 'pending') return (
    <div className="max-w-lg mx-auto px-4 py-16 sm:py-20">
      <div className="text-center fade-up">
        {/* Animated icon */}
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 rounded-full animate-ping opacity-20"
            style={{ background: 'rgba(251,191,36,0.3)' }} />
          <div className="relative w-20 h-20 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }}>
            <span className="text-3xl">⏳</span>
          </div>
        </div>

        <h1 className="text-xl sm:text-2xl font-bold text-white">Menunggu Verifikasi</h1>
        <p className="text-neutral-500 text-sm mt-3 max-w-sm mx-auto leading-relaxed">
          Perusahaan <span className="text-white font-medium">{company.nama}</span> sedang ditinjau oleh admin.
          Kamu akan bisa memasang lowongan setelah disetujui.
        </p>

        {/* Company info preview */}
        <div className="card p-5 mt-8 text-left max-w-sm mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shrink-0"
              style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)' }}>
              {company.nama?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{company.nama}</p>
              {company.alamat && <p className="text-xs text-neutral-600">📍 {company.alamat}</p>}
            </div>
          </div>
          {company.deskripsi && (
            <p className="text-xs text-neutral-600 leading-relaxed">{company.deskripsi}</p>
          )}
        </div>

        <p className="text-neutral-700 text-xs mt-6">Biasanya memakan waktu 1×24 jam</p>
      </div>
    </div>
  )

  /* ══════════════════════════════
     STATE 3: Rejected
     ══════════════════════════════ */
  if (company.status === 'rejected') return (
    <div className="max-w-lg mx-auto px-4 py-16 sm:py-20">
      <div className="text-center fade-up">
        <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <span className="text-3xl">✕</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-white">Pendaftaran Ditolak</h1>
        <p className="text-neutral-500 text-sm mt-3 max-w-sm mx-auto">
          Perusahaan <span className="text-white font-medium">{company.nama}</span> tidak disetujui.
        </p>
        {company.rejection_reason && (
          <div className="card p-4 mt-6 text-left max-w-sm mx-auto">
            <p className="text-xs font-medium text-neutral-600 mb-1">Alasan penolakan:</p>
            <p className="text-sm text-red-400">{company.rejection_reason}</p>
          </div>
        )}
        <p className="text-neutral-700 text-xs mt-6">Hubungi admin jika kamu merasa ini adalah kesalahan.</p>
      </div>
    </div>
  )

  /* ══════════════════════════════
     STATE 4: Approved — Full Dashboard
     ══════════════════════════════ */
  const openJobs = jobs.filter(j => j.status === 'open')
  const closedJobs = jobs.filter(j => j.status === 'closed')
  const totalApps = jobs.reduce((sum, j) => sum + (j.applications?.[0]?.count || 0), 0)

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-5 sm:space-y-6">

      {/* ── Company Profile Header ── */}
      <div className="card-elevated p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center font-bold text-lg sm:text-xl text-white shrink-0"
            style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)' }}>
            {company.nama?.charAt(0)?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-bold text-white truncate">{company.nama}</h1>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-md"
                style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', color: '#10b981' }}>
                ✓ Terverifikasi
              </span>
            </div>
            {company.alamat && <p className="text-neutral-600 text-xs sm:text-sm mt-0.5">📍 {company.alamat}</p>}
            {company.deskripsi && <p className="text-neutral-700 text-xs mt-2 leading-relaxed line-clamp-2 hidden sm:block">{company.deskripsi}</p>}
          </div>
          <button onClick={() => setShowCreateJob(true)}
            className="btn-accent text-sm py-2.5 px-4 sm:px-5 flex items-center justify-center gap-2 w-full sm:w-auto shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Pasang Lowongan
          </button>
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {[
          { label: 'Lowongan Aktif', value: openJobs.length, color: '#10b981' },
          { label: 'Total Pelamar', value: totalApps, color: '#60a5fa' },
          { label: 'Ditutup', value: closedJobs.length, color: '#525252' },
        ].map(s => (
          <div key={s.label} className="card p-3 sm:p-5 text-center">
            <p className="text-xl sm:text-2xl font-bold text-white">{s.value}</p>
            <p className="text-[10px] sm:text-xs font-medium mt-0.5 truncate" style={{ color: s.color }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Section Tabs ── */}
      <div className="flex gap-1 p-1 rounded-xl"
        style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.06)' }}>
        {[
          { key: 'lowongan', label: `Lowongan Aktif (${openJobs.length})` },
          { key: 'closed', label: `Riwayat (${closedJobs.length})` },
          { key: 'profil', label: 'Profil' },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveSection(tab.key)}
            className="flex-1 py-2 sm:py-2.5 text-xs sm:text-sm font-medium rounded-lg transition-all truncate px-1"
            style={activeSection === tab.key
              ? { background: 'rgba(255,255,255,0.08)', color: '#f5f5f5', border: '1px solid rgba(255,255,255,0.1)' }
              : { color: '#525252', border: '1px solid transparent' }
            }>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══ Lowongan Aktif ═══ */}
      {activeSection === 'lowongan' && (
        <div className="space-y-3 fade-up">
          {openJobs.length === 0 ? (
            <div className="card rounded-2xl py-14 sm:py-20 text-center">
              <div className="text-3xl sm:text-4xl mb-3 opacity-30">📋</div>
              <p className="text-white font-semibold text-sm sm:text-base">Belum Ada Lowongan Aktif</p>
              <p className="text-neutral-600 text-xs sm:text-sm mt-2 mb-5">Pasang lowongan pertamamu dan mulai terima pelamar</p>
              <button onClick={() => setShowCreateJob(true)} className="btn-accent text-sm py-2.5 px-6 inline-flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Pasang Lowongan
              </button>
            </div>
          ) : (
            openJobs.map(j => (
              <JobWithApplicants key={j.id} job={j} onClose={closeJob} onUpdateAppStatus={updateAppStatus} />
            ))
          )}
        </div>
      )}

      {/* ═══ Riwayat Ditutup ═══ */}
      {activeSection === 'closed' && (
        <div className="space-y-2 fade-up">
          {closedJobs.length === 0 ? (
            <div className="card rounded-2xl py-14 text-center">
              <p className="text-neutral-600 text-xs sm:text-sm font-medium">Belum ada lowongan yang ditutup.</p>
            </div>
          ) : (
            closedJobs.map(j => (
              <div key={j.id} className="card p-4 opacity-60">
                <p className="font-medium text-white text-sm">{j.judul}</p>
                <p className="text-xs text-neutral-700 mt-0.5">
                  {j.lokasi && ` ${j.lokasi}`}{j.kategori && ` · ${j.kategori}`}
                  {j.gaji && ` · Rp ${Number(j.gaji).toLocaleString('id-ID')}`}
                </p>
              </div>
            ))
          )}
        </div>
      )}

      {/* ═══ Profil Perusahaan ═══ */}
      {activeSection === 'profil' && (
        <div className="card p-5 sm:p-6 fade-up">
          <h2 className="text-sm font-semibold text-white mb-4">Profil Perusahaan</h2>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-neutral-600 mb-1">Nama Perusahaan</p>
              <p className="text-sm text-white font-medium">{company.nama}</p>
            </div>
            {company.alamat && (
              <div>
                <p className="text-xs text-neutral-600 mb-1">Alamat</p>
                <p className="text-sm text-white font-medium">{company.alamat}</p>
              </div>
            )}
            {company.deskripsi && (
              <div>
                <p className="text-xs text-neutral-600 mb-1">Deskripsi</p>
                <p className="text-sm text-neutral-400 leading-relaxed">{company.deskripsi}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-neutral-600 mb-1">Status</p>
              <span className="text-xs font-medium px-2.5 py-1 rounded-md"
                style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', color: '#10b981' }}>
                ✓ Terverifikasi
              </span>
            </div>
            <div>
              <p className="text-xs text-neutral-600 mb-1">Bergabung</p>
              <p className="text-sm text-neutral-400">
                {new Date(company.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Create Job Modal ── */}
      {showCreateJob && (
        <CreateJobModal
          companyId={company.id}
          onClose={() => setShowCreateJob(false)}
          onCreated={() => { setShowCreateJob(false); load() }}
        />
      )}
    </div>
  )
}