import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import StarRating from '../../components/StarRating'
import ChatPanel from '../../components/ChatPanel'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

/* ── Reusable Input ── */
function InputField({ label, textarea, ...props }) {
  if (textarea) return (
    <div>
      {label && <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>{label}</label>}
      <textarea className="input-dark resize-none" rows={4} {...props} />
    </div>
  )
  return (
    <div>
      {label && <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>{label}</label>}
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

/* ── Buka CV (bucket privat -> signed URL) ── */
async function openCv(cvUrl) {
  const path = cvUrl.includes('/cv/') ? cvUrl.split('/cv/').pop() : cvUrl
  const w = window.open('', '_blank')
  const { data, error } = await supabase.storage.from('cv').createSignedUrl(path, 60)
  if (error || !data?.signedUrl) {
    w?.close()
    alert('CV tidak bisa dibuka: ' + (error?.message || 'file tidak ditemukan'))
    return
  }
  if (w) w.location.href = data.signedUrl
  else window.location.href = data.signedUrl
}

/* ── ISO (UTC) -> nilai untuk input datetime-local (waktu lokal) ── */
function toLocalInput(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d)) return ''
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/* ── Modal Profil Pelamar ── */
function ApplicantProfileModal({ app, avg, onClose }) {
  const [p, setP] = useState(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  useEffect(() => {
    let active = true
    supabase.from('profiles')
      .select('nama, no_hp, pendidikan, skill, pengalaman, tentang, cv_url')
      .eq('id', app.user_id).maybeSingle()
      .then(({ data, error }) => {
        if (!active) return
        if (error) setErr(error.message)
        setP(data)
        setLoading(false)
      })
    return () => { active = false }
  }, [app.user_id])

  const skills = p?.skill ? p.skill.split(',').map(s => s.trim()).filter(Boolean) : []
  const cfg = APP_STATUS[app.status] || APP_STATUS.dikirim

  function Row({ label, children }) {
    if (!children) return null
    return (
      <div>
        <p className="text-[11px] mb-1" style={{ color: 'var(--muted)' }}>{label}</p>
        <p className="text-sm whitespace-pre-line" style={{ color: 'var(--text)' }}>{children}</p>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 flex items-end sm:items-center justify-center z-50 px-0 sm:px-4"
      style={{ background: 'var(--overlay)', backdropFilter: 'blur(8px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="card-elevated w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl rounded-b-none sm:rounded-b-2xl p-6 fade-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-start gap-3 mb-5">
          <div className="w-12 h-12 rounded-full flex items-center justify-center font-semibold text-lg shrink-0"
            style={{ background: 'var(--avatar-bg)', border: '1px solid var(--avatar-border)', color: 'var(--avatar-text)' }}>
            {(p?.nama || app.profiles?.nama || '?').charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold truncate" style={{ color: 'var(--text)' }}>{p?.nama || app.profiles?.nama || 'Pelamar'}</h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-md"
                style={{ background: `${cfg.color}15`, border: `1px solid ${cfg.color}30`, color: cfg.color }}>
                {cfg.label}
              </span>
              <span className="text-[11px]" style={{ color: 'var(--muted)' }}>
                Melamar {new Date(app.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
            {avg && (
              <div className="mt-1">
                <StarRating value={avg.avg} readOnly size={12} showValue count={avg.count} />
              </div>
            )}
          </div>
          <button onClick={onClose} style={{ color: 'var(--muted)' }} aria-label="Tutup">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-center py-8" style={{ color: 'var(--muted)' }}>Memuat profil...</p>
        ) : err ? (
          <p className="text-sm p-3 rounded-lg" style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171' }}>{err}</p>
        ) : !p ? (
          <p className="text-sm text-center py-8" style={{ color: 'var(--muted)' }}>Profil tidak ditemukan.</p>
        ) : (
          <div className="space-y-4">
            <Row label="No. HP">{p.no_hp}</Row>
            <Row label="Pendidikan terakhir">{p.pendidikan}</Row>
            {skills.length > 0 && (
              <div>
                <p className="text-[11px] mb-1.5" style={{ color: 'var(--muted)' }}>Skill</p>
                <div className="flex flex-wrap gap-1.5">
                  {skills.map(s => (
                    <span key={s} className="text-xs px-2 py-0.5 rounded-md font-medium"
                      style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}>{s}</span>
                  ))}
                </div>
              </div>
            )}
            <Row label="Pengalaman">{p.pengalaman}</Row>
            <Row label="Tentang">{p.tentang}</Row>
            {!p.no_hp && !p.pendidikan && !p.skill && !p.pengalaman && !p.tentang && (
              <p className="text-xs" style={{ color: 'var(--muted)' }}>Pelamar belum melengkapi profilnya.</p>
            )}

            <div className="flex flex-wrap gap-2 pt-2">
              {p.cv_url ? (
                <button onClick={() => openCv(p.cv_url)}
                  className="text-xs font-medium px-3 py-2 rounded-lg"
                  style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', color: '#60a5fa' }}>
                  📄 Lihat CV
                </button>
              ) : (
                <span className="text-xs" style={{ color: 'var(--muted)' }}>Belum mengunggah CV</span>
              )}
              {app.status !== 'ditolak' && (
                <button onClick={() => { app.onChat?.(app.id, p.nama); onClose() }}
                  className="text-xs font-medium px-3 py-2 rounded-lg"
                  style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', color: '#60a5fa' }}>
                  💬 Chat
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Applicant Card ── */
function ApplicantCard({ app, onUpdateStatus, companyOwnerId }) {
  const cfg = APP_STATUS[app.status] || APP_STATUS.dikirim
  const [open, setOpen] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [jadwal, setJadwal] = useState(toLocalInput(app.jadwal_wawancara))
  const [savingJadwal, setSavingJadwal] = useState(false)
  const [jadwalMsg, setJadwalMsg] = useState('')
  const [rating, setRating] = useState(null) // existing rating
  const [ratingForm, setRatingForm] = useState({ skor: 0, komentar: '' })
  const [ratingBusy, setRatingBusy] = useState(false)
  const [applicantAvgRating, setApplicantAvgRating] = useState(null)

  // Load existing rating and applicant avg
  useEffect(() => {
    // My rating for this applicant
    supabase.from('ratings').select('skor, komentar').eq('application_id', app.id).eq('rater_id', companyOwnerId).maybeSingle()
      .then(({ data }) => { if (data) setRating(data) })
    // Applicant average rating
    supabase.from('ratings').select('skor').eq('target_profile_id', app.user_id)
      .then(({ data }) => {
        if (data && data.length > 0) {
          const avg = data.reduce((s, r) => s + r.skor, 0) / data.length
          setApplicantAvgRating({ avg, count: data.length })
        }
      })
  }, [app.id, app.user_id, companyOwnerId])

  async function saveJadwal() {
    if (!jadwal) return
    setSavingJadwal(true); setJadwalMsg('')
    const { error } = await supabase
      .from('applications')
      .update({ jadwal_wawancara: new Date(jadwal).toISOString() })
      .eq('id', app.id)
    setSavingJadwal(false)
    setJadwalMsg(error ? 'Gagal: ' + error.message : 'Tersimpan ✓')
    setTimeout(() => setJadwalMsg(''), 3000)
  }

  async function submitRating() {
    if (!ratingForm.skor) return
    setRatingBusy(true)
    const { error } = await supabase.from('ratings').insert({
      application_id: app.id, rater_id: companyOwnerId, target_profile_id: app.user_id,
      skor: ratingForm.skor, komentar: ratingForm.komentar || null,
    })
    setRatingBusy(false)
    if (!error) setRating({ skor: ratingForm.skor, komentar: ratingForm.komentar })
    else alert('Gagal menyimpan rating: ' + error.message)
  }

  // Parse skills
  const skills = app.profiles?.skill ? app.profiles.skill.split(',').map(s => s.trim()).filter(Boolean) : []

  return (
    <div className="p-3 sm:p-4 rounded-xl transition-all"
      style={{ background: 'var(--tag-bg)', border: '1px solid var(--border)' }}>
      <div className="flex items-center gap-3">
        <button onClick={() => setShowProfile(true)} title="Lihat profil pelamar"
          className="w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm shrink-0"
          style={{ background: 'var(--avatar-bg)', border: '1px solid var(--avatar-border)', color: 'var(--avatar-text)' }}>
          {app.profiles?.nama?.charAt(0)?.toUpperCase() || '?'}
        </button>
        <div className="flex-1 min-w-0">
          <button onClick={() => setShowProfile(true)}
            className="font-medium text-sm truncate max-w-full text-left hover:underline" style={{ color: 'var(--text)' }}>
            {app.profiles?.nama || 'Pelamar'}
          </button>
          {/* Show pendidikan chip */}
          <div className="flex flex-wrap gap-1 mt-0.5">
            {app.profiles?.pendidikan && (
              <span className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                style={{ background: 'rgba(59,130,246,0.08)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.15)' }}>
                {app.profiles.pendidikan}
              </span>
            )}
            {skills.slice(0, 3).map(s => (
              <span key={s} className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}>
                {s}
              </span>
            ))}
            {skills.length > 3 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ color: 'var(--muted)' }}>+{skills.length - 3}</span>
            )}
          </div>
          {/* Applicant avg rating */}
          {applicantAvgRating && (
            <div className="mt-1">
              <StarRating value={applicantAvgRating.avg} readOnly size={12} showValue count={applicantAvgRating.count} />
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {app.profiles?.cv_url && (
            <button onClick={() => openCv(app.profiles.cv_url)}
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
        <button onClick={() => openCv(app.profiles.cv_url)}
          className="sm:hidden mt-2 text-xs font-medium px-2.5 py-1.5 rounded-lg inline-flex items-center gap-1"
          style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', color: '#60a5fa' }}>
          📄 Lihat CV
        </button>
      )}

      {showProfile && (
        <ApplicantProfileModal app={app} avg={applicantAvgRating} onClose={() => setShowProfile(false)} />
      )}

      {/* Expanded section */}
      {open && (
        <div className="mt-3 pt-3 space-y-3 fade-up" style={{ borderTop: '1px solid var(--border)' }}>
          {/* Status changer */}
          <div className="flex flex-wrap gap-1.5">
            <span className="text-[10px] font-medium self-center mr-1" style={{ color: 'var(--muted)' }}>Ubah status:</span>
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

          {/* Jadwal wawancara */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Jadwal Wawancara:</span>
            <input type="datetime-local" className="input-dark text-xs py-1.5 px-2 flex-1" style={{ maxWidth: 220 }}
              value={jadwal} onChange={e => setJadwal(e.target.value)} />
            <button onClick={saveJadwal} disabled={savingJadwal || !jadwal}
              className="text-xs font-medium px-3 py-1.5 rounded-lg disabled:opacity-40"
              style={{ background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', color: 'var(--accent)' }}>
              {savingJadwal ? '...' : 'Simpan'}
            </button>
            {jadwalMsg && <span className="text-[11px]" style={{ color: 'var(--muted)' }}>{jadwalMsg}</span>}
          </div>

          {/* Chat button */}
          {app.status !== 'ditolak' && (
            <button onClick={() => app.onChat?.(app.id, app.profiles?.nama)}
              className="text-xs font-medium px-3 py-1.5 rounded-lg flex items-center gap-1"
              style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', color: '#60a5fa' }}>
              💬 Chat dengan Pelamar
            </button>
          )}

          {/* Rating section for 'diterima' */}
          {app.status === 'diterima' && (
            <div className="pt-2">
              {rating ? (
                <StarRating value={rating.skor} readOnly submitted comment={rating.komentar} label="Rating yang kamu berikan" size={16} />
              ) : (
                <StarRating
                  label="Beri rating pelamar"
                  value={ratingForm.skor}
                  onChange={v => setRatingForm(prev => ({ ...prev, skor: v }))}
                  comment={ratingForm.komentar}
                  onCommentChange={v => setRatingForm(prev => ({ ...prev, komentar: v }))}
                  onSubmit={submitRating}
                  submitting={ratingBusy}
                  size={18}
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ── Job Card with Applicants ── */
function JobWithApplicants({ job, onClose, onUpdateAppStatus, companyOwnerId, onChat }) {
  const [apps, setApps] = useState([])
  const [loadingApps, setLoadingApps] = useState(false)
  const [expanded, setExpanded] = useState(false)

  async function loadApps() {
    if (apps.length > 0) { setExpanded(!expanded); return }
    setLoadingApps(true)
    const { data } = await supabase
      .from('applications')
      .select('id, status, created_at, user_id, jadwal_wawancara, profiles(nama, cv_url, pendidikan, skill)')
      .eq('job_id', job.id)
      .order('created_at', { ascending: false })
    setApps(data || [])
    setLoadingApps(false)
    setExpanded(true)
  }

  async function changeStatus(id, status) {
    await onUpdateAppStatus(id, status)
    setApps(prev => prev.map(a => a.id === id ? { ...a, status } : a))
  }

  const appCount = apps.length

  return (
    <div className="card overflow-hidden">
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{job.judul}</p>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-md"
                style={job.status === 'open'
                  ? { background: 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }
                  : { background: 'var(--tag-bg)', color: 'var(--muted)', border: '1px solid var(--border)' }}>
                {job.status === 'open' ? '● Aktif' : '● Ditutup'}
              </span>
            </div>
            <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
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

        <div className="flex items-center gap-2 mt-3">
          <button onClick={loadApps}
            className="text-xs font-medium px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all"
            style={{ background: 'var(--tag-bg)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
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

      {expanded && (
        <div className="px-4 sm:px-5 pb-4 sm:pb-5 space-y-2 fade-up" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="pt-3">
            {apps.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-xs font-medium" style={{ color: 'var(--muted)' }}>Belum ada pelamar untuk lowongan ini</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-[11px] font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--muted)' }}>
                  {apps.length} Pelamar
                </p>
                {apps.map(a => (
                  <ApplicantCard key={a.id} app={{ ...a, onChat }}
                    onUpdateStatus={changeStatus} companyOwnerId={companyOwnerId} />
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
    setBusy(true); setMsg('')
    const payload = { ...form, company_id: companyId, gaji: form.gaji ? Number(form.gaji) : null }
    const { error } = await supabase.from('jobs').insert(payload)
    setBusy(false)
    if (error) setMsg(error.message)
    else onCreated()
  }

  return (
    <div className="fixed inset-0 flex items-end sm:items-center justify-center z-50 px-0 sm:px-4"
      style={{ background: 'var(--overlay)', backdropFilter: 'blur(8px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="card-elevated w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl rounded-b-none sm:rounded-b-2xl p-6 sm:p-8 fade-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Pasang Lowongan Baru</h2>
          <button onClick={onClose} style={{ color: 'var(--muted)' }}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {msg && (
          <div className="text-sm p-3 rounded-lg mb-4" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', color: '#f87171' }}>{msg}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <InputField label="Judul Posisi *" placeholder="contoh: Senior UI/UX Designer" value={form.judul}
            onChange={e => setForm({ ...form, judul: e.target.value })} required />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <InputField label="Lokasi" placeholder="Jakarta" value={form.lokasi} onChange={e => setForm({ ...form, lokasi: e.target.value })} />
            <InputField label="Kategori" placeholder="Technology" value={form.kategori} onChange={e => setForm({ ...form, kategori: e.target.value })} />
            <InputField label="Gaji (Rp)" type="number" placeholder="5000000" value={form.gaji} onChange={e => setForm({ ...form, gaji: e.target.value })} />
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

/* ── Mini Chart ── */
function MiniApplicantChart({ jobs }) {
  const data = jobs.map(j => ({
    name: j.judul?.length > 12 ? j.judul.slice(0, 12) + '…' : j.judul,
    pelamar: j.applications?.[0]?.count || 0,
  })).filter(d => d.pelamar > 0)

  if (data.length === 0) return null

  return (
    <div className="card p-4 sm:p-5">
      <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text)' }}>Pelamar per Lowongan</h3>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data}>
          <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: 'var(--muted)' }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip
            contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, color: 'var(--text)' }}
            cursor={{ fill: 'var(--tag-bg)' }}
          />
          <Bar dataKey="pelamar" fill="var(--accent)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
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
  const [chatAppId, setChatAppId] = useState(null)
  const [chatOtherName, setChatOtherName] = useState('')

  async function load() {
    const { data: c } = await supabase
      .from('companies').select('*').eq('owner_id', user.id)
      .order('created_at', { ascending: false }).limit(1).maybeSingle()
    setCompany(c)
    if (c) {
      const { data: j } = await supabase.from('jobs').select('*, applications(count)').eq('company_id', c.id).order('created_at', { ascending: false })
      setJobs(j || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
    // muat ulang saat tab dibuka kembali (mis. setelah admin menyetujui)
    const onFocus = () => load()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])

  async function createCompany(e) {
    e.preventDefault(); setMsg('')
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

  function handleChat(appId, name) {
    setChatAppId(appId)
    setChatOtherName(name || 'Pelamar')
  }

  /* ── Loading ── */
  if (loading) return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="text-center">
        <div className="relative w-12 h-12 mx-auto mb-4"><div className="loading-ring" /></div>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>Memuat dashboard...</p>
      </div>
    </div>
  )

  /* STATE 1: No company */
  if (!company) return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <div className="card-elevated p-6 sm:p-8">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <span className="text-2xl">🏢</span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold" style={{ color: 'var(--text)' }}>Daftarkan Perusahaanmu</h1>
          <p className="text-xs sm:text-sm mt-2" style={{ color: 'var(--muted)' }}>Lengkapi profil untuk mulai memasang lowongan</p>
        </div>
        {msg && <div className="text-sm p-3 rounded-lg mb-4" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', color: '#f87171' }}>{msg}</div>}
        <form onSubmit={createCompany} className="space-y-4">
          <InputField label="Nama Perusahaan" placeholder="PT. Contoh Indonesia" value={cForm.nama} onChange={e => setCForm({ ...cForm, nama: e.target.value })} required />
          <InputField label="Alamat" placeholder="Jl. Sudirman No.1, Jakarta" value={cForm.alamat} onChange={e => setCForm({ ...cForm, alamat: e.target.value })} />
          <InputField textarea label="Deskripsi" placeholder="Ceritakan tentang perusahaanmu..." value={cForm.deskripsi} onChange={e => setCForm({ ...cForm, deskripsi: e.target.value })} />
          <button className="btn-accent w-full py-3 text-sm">Daftarkan Perusahaan</button>
        </form>
      </div>
    </div>
  )

  /* STATE 2: Pending */
  if (company.status === 'pending') return (
    <div className="max-w-lg mx-auto px-4 py-16 sm:py-20">
      <div className="text-center fade-up">
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ background: 'rgba(251,191,36,0.3)' }} />
          <div className="relative w-20 h-20 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }}>
            <span className="text-3xl">⏳</span>
          </div>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--text)' }}>Menunggu Verifikasi</h1>
        <p className="text-sm mt-3 max-w-sm mx-auto leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          Perusahaan <span className="font-medium" style={{ color: 'var(--text)' }}>{company.nama}</span> sedang ditinjau oleh admin.
        </p>
        <div className="card p-5 mt-8 text-left max-w-sm mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0"
              style={{ background: 'var(--avatar-bg)', border: '1px solid var(--avatar-border)', color: 'var(--text)' }}>
              {company.nama?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{company.nama}</p>
              {company.alamat && <p className="text-xs" style={{ color: 'var(--muted)' }}>📍 {company.alamat}</p>}
            </div>
          </div>
          {company.deskripsi && <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>{company.deskripsi}</p>}
        </div>
        <p className="text-xs mt-6" style={{ color: 'var(--muted)' }}>Biasanya memakan waktu 1×24 jam</p>
      </div>
    </div>
  )

  /* STATE 3: Rejected */
  if (company.status === 'rejected') return (
    <div className="max-w-lg mx-auto px-4 py-16 sm:py-20">
      <div className="text-center fade-up">
        <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <span className="text-3xl">✕</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--text)' }}>Pendaftaran Ditolak</h1>
        <p className="text-sm mt-3 max-w-sm mx-auto" style={{ color: 'var(--text-secondary)' }}>
          Perusahaan <span className="font-medium" style={{ color: 'var(--text)' }}>{company.nama}</span> tidak disetujui.
        </p>
        {company.rejection_reason && (
          <div className="card p-4 mt-6 text-left max-w-sm mx-auto">
            <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted)' }}>Alasan penolakan:</p>
            <p className="text-sm" style={{ color: '#f87171' }}>{company.rejection_reason}</p>
          </div>
        )}
        <p className="text-xs mt-6" style={{ color: 'var(--muted)' }}>Hubungi admin jika kamu merasa ini adalah kesalahan.</p>
      </div>
    </div>
  )

  /* STATE 4: Approved */
  const openJobs = jobs.filter(j => j.status === 'open')
  const closedJobs = jobs.filter(j => j.status === 'closed')
  const totalApps = jobs.reduce((sum, j) => sum + (j.applications?.[0]?.count || 0), 0)

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-5 sm:space-y-6">
      {/* Company Profile Header */}
      <div className="card-elevated p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center font-bold text-lg sm:text-xl shrink-0"
            style={{ background: 'var(--avatar-bg)', border: '1px solid var(--avatar-border)', color: 'var(--text)' }}>
            {company.nama?.charAt(0)?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-bold truncate" style={{ color: 'var(--text)' }}>{company.nama}</h1>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-md"
                style={{ background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', color: 'var(--accent)' }}>
                ✓ Terverifikasi
              </span>
            </div>
            {company.alamat && <p className="text-xs sm:text-sm mt-0.5" style={{ color: 'var(--muted)' }}>📍 {company.alamat}</p>}
            {company.deskripsi && <p className="text-xs mt-2 leading-relaxed line-clamp-2 hidden sm:block" style={{ color: 'var(--muted)' }}>{company.deskripsi}</p>}
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

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {[
          { label: 'Lowongan Aktif', value: openJobs.length, color: 'var(--accent)' },
          { label: 'Total Pelamar', value: totalApps, color: '#60a5fa' },
          { label: 'Ditutup', value: closedJobs.length, color: 'var(--muted)' },
        ].map(s => (
          <div key={s.label} className="card p-3 sm:p-5 text-center">
            <p className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--text)' }}>{s.value}</p>
            <p className="text-[10px] sm:text-xs font-medium mt-0.5 truncate" style={{ color: s.color }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Mini Chart */}
      <MiniApplicantChart jobs={jobs} />

      {/* Section Tabs */}
      <div className="flex gap-1 p-1 rounded-xl"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        {[
          { key: 'lowongan', label: `Lowongan Aktif (${openJobs.length})` },
          { key: 'closed', label: `Riwayat (${closedJobs.length})` },
          { key: 'profil', label: 'Profil' },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveSection(tab.key)}
            className="flex-1 py-2 sm:py-2.5 text-xs sm:text-sm font-medium rounded-lg transition-all truncate px-1"
            style={activeSection === tab.key
              ? { background: 'var(--tag-bg)', color: 'var(--text)', border: '1px solid var(--border-hover)' }
              : { color: 'var(--muted)', border: '1px solid transparent' }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Lowongan Aktif */}
      {activeSection === 'lowongan' && (
        <div className="space-y-3 fade-up">
          {openJobs.length === 0 ? (
            <div className="card rounded-2xl py-14 sm:py-20 text-center">
              <div className="text-3xl sm:text-4xl mb-3 opacity-30">📋</div>
              <p className="font-semibold text-sm sm:text-base" style={{ color: 'var(--text)' }}>Belum Ada Lowongan Aktif</p>
              <p className="text-xs sm:text-sm mt-2 mb-5" style={{ color: 'var(--muted)' }}>Pasang lowongan pertamamu dan mulai terima pelamar</p>
              <button onClick={() => setShowCreateJob(true)} className="btn-accent text-sm py-2.5 px-6 inline-flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Pasang Lowongan
              </button>
            </div>
          ) : (
            openJobs.map(j => (
              <JobWithApplicants key={j.id} job={j} onClose={closeJob} onUpdateAppStatus={updateAppStatus}
                companyOwnerId={user.id} onChat={handleChat} />
            ))
          )}
        </div>
      )}

      {/* Riwayat */}
      {activeSection === 'closed' && (
        <div className="space-y-2 fade-up">
          {closedJobs.length === 0 ? (
            <div className="card rounded-2xl py-14 text-center">
              <p className="text-xs sm:text-sm font-medium" style={{ color: 'var(--muted)' }}>Belum ada lowongan yang ditutup.</p>
            </div>
          ) : (
            closedJobs.map(j => (
              <div key={j.id} className="card p-4 opacity-60">
                <p className="font-medium text-sm" style={{ color: 'var(--text)' }}>{j.judul}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                  {j.lokasi && `📍 ${j.lokasi}`}{j.kategori && ` · ${j.kategori}`}
                  {j.gaji && ` · Rp ${Number(j.gaji).toLocaleString('id-ID')}`}
                </p>
              </div>
            ))
          )}
        </div>
      )}

      {/* Profil */}
      {activeSection === 'profil' && (
        <div className="card p-5 sm:p-6 fade-up">
          <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--text)' }}>Profil Perusahaan</h2>
          <div className="space-y-4">
            {[
              { label: 'Nama Perusahaan', value: company.nama },
              company.alamat && { label: 'Alamat', value: company.alamat },
              company.deskripsi && { label: 'Deskripsi', value: company.deskripsi },
            ].filter(Boolean).map(item => (
              <div key={item.label}>
                <p className="text-xs mb-1" style={{ color: 'var(--muted)' }}>{item.label}</p>
                <p className="text-sm font-medium" style={{ color: item.label === 'Deskripsi' ? 'var(--text-secondary)' : 'var(--text)' }}>{item.value}</p>
              </div>
            ))}
            <div>
              <p className="text-xs mb-1" style={{ color: 'var(--muted)' }}>Status</p>
              <span className="text-xs font-medium px-2.5 py-1 rounded-md"
                style={{ background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', color: 'var(--accent)' }}>
                ✓ Terverifikasi
              </span>
            </div>
            <div>
              <p className="text-xs mb-1" style={{ color: 'var(--muted)' }}>Bergabung</p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {new Date(company.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Create Job Modal */}
      {showCreateJob && (
        <CreateJobModal companyId={company.id} onClose={() => setShowCreateJob(false)} onCreated={() => { setShowCreateJob(false); load() }} />
      )}

      {/* Chat Panel */}
      {chatAppId && (
        <ChatPanel applicationId={chatAppId} otherName={chatOtherName} onClose={() => setChatAppId(null)} />
      )}
    </div>
  )
}