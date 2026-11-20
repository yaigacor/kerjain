import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function AdminVerify() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('verifikasi')

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>Admin Panel</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>Kelola platform Kerjain</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl mb-6 overflow-x-auto no-scrollbar"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        {[
          { key: 'verifikasi', label: 'Verifikasi' },
          { key: 'laporan', label: 'Laporan' },
          { key: 'log', label: 'Log Aktivitas' },
          { key: 'statistik', label: 'Statistik' },
        ].map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className="flex-1 py-2.5 text-xs sm:text-sm font-medium rounded-lg transition-all whitespace-nowrap px-3"
            style={activeTab === t.key
              ? { background: 'var(--tag-bg)', color: 'var(--text)', border: '1px solid var(--border-hover)' }
              : { color: 'var(--muted)', border: '1px solid transparent' }}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'verifikasi' && <VerifikasiTab adminId={user.id} />}
      {activeTab === 'laporan' && <LaporanTab adminId={user.id} />}
      {activeTab === 'log' && <LogTab />}
      {activeTab === 'statistik' && <StatistikTab />}
    </div>
  )
}

/* ══════════════════════════════
   TAB: Verifikasi Perusahaan
   ══════════════════════════════ */
function VerifikasiTab({ adminId }) {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [rejectModal, setRejectModal] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [busy, setBusy] = useState('')

  async function load() {
    const { data } = await supabase.from('companies').select('*').eq('status', 'pending').order('created_at')
    setList(data || []); setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function setujui(company) {
    setBusy(company.id)
    await supabase.from('companies').update({ status: 'approved', rejection_reason: null }).eq('id', company.id)
    await supabase.from('admin_logs').insert({
      admin_id: adminId, aksi: 'Setujui perusahaan', target_tipe: 'company', target_id: company.id,
      keterangan: `Menyetujui perusahaan ${company.nama}`,
    })
    setBusy(''); load()
  }

  async function tolak(company) {
    if (!rejectReason.trim()) return
    setBusy(company.id)
    await supabase.from('companies').update({ status: 'rejected', rejection_reason: rejectReason }).eq('id', company.id)
    await supabase.from('admin_logs').insert({
      admin_id: adminId, aksi: 'Tolak perusahaan', target_tipe: 'company', target_id: company.id,
      keterangan: `Menolak perusahaan ${company.nama}: ${rejectReason}`,
    })
    setBusy(''); setRejectModal(null); setRejectReason(''); load()
  }

  if (loading) return (
    <div className="space-y-3">
      {[1,2].map(i => (
        <div key={i} className="card p-6 flex gap-4">
          <div className="skeleton" style={{ width: 48, height: 48, borderRadius: '50%' }} />
          <div className="flex-1 space-y-3">
            <div className="skeleton" style={{ height: 14, width: '35%' }} />
            <div className="skeleton" style={{ height: 11, width: '50%' }} />
          </div>
        </div>
      ))}
    </div>
  )

  if (list.length === 0) return (
    <div className="card rounded-2xl py-20 text-center">
      <div className="w-16 h-16 mx-auto mb-5 rounded-2xl flex items-center justify-center"
        style={{ background: 'var(--accent-soft)', border: '1px solid var(--accent-border)' }}>
        <svg className="w-8 h-8" style={{ color: 'var(--accent)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <p className="font-semibold text-base" style={{ color: 'var(--text)' }}>Semua Bersih</p>
      <p className="text-sm mt-2" style={{ color: 'var(--muted)' }}>Tidak ada pendaftaran yang menunggu verifikasi.</p>
    </div>
  )

  return (
    <>
      {list.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl mb-6 text-sm font-medium"
          style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.15)', color: '#fbbf24' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
          <span><b style={{ color: 'var(--text)' }}>{list.length}</b> perusahaan menunggu verifikasi</span>
        </div>
      )}
      <ul className="space-y-3">
        {list.map(c => (
          <li key={c.id} className="card job-card p-6">
            <div className="flex flex-col sm:flex-row gap-5">
              <div className="w-12 h-12 rounded-full flex items-center justify-center font-semibold text-lg shrink-0"
                style={{ background: 'var(--avatar-bg)', border: '1px solid var(--avatar-border)', color: 'var(--text-secondary)' }}>
                {c.nama?.charAt(0)?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-base" style={{ color: 'var(--text)' }}>{c.nama}</p>
                {c.alamat && <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>📍 {c.alamat}</p>}
                {c.deskripsi && <p className="text-sm mt-2 leading-relaxed line-clamp-2" style={{ color: 'var(--muted)' }}>{c.deskripsi}</p>}
                <p className="text-xs mt-3 font-medium" style={{ color: 'var(--muted)' }}>
                  Didaftarkan: {new Date(c.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
              <div className="flex sm:flex-col gap-2 shrink-0">
                <button onClick={() => setujui(c)} disabled={busy === c.id}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
                  style={{ background: 'var(--accent)', color: '#fff' }}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  Setujui
                </button>
                <button onClick={() => { setRejectModal(c); setRejectReason('') }} disabled={busy === c.id}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
                  style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', color: '#f87171' }}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Tolak
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 px-4"
          style={{ background: 'var(--overlay)', backdropFilter: 'blur(8px)' }}>
          <div className="card-elevated p-8 max-w-md w-full fade-up">
            <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text)' }}>Tolak Perusahaan?</h2>
            <p className="text-sm mb-5" style={{ color: 'var(--muted)' }}>Masukkan alasan yang jelas.</p>
            <textarea className="input-dark resize-none" placeholder="Alasan penolakan..." rows={3}
              value={rejectReason} onChange={e => setRejectReason(e.target.value)} autoFocus />
            <div className="flex gap-3 mt-5">
              <button onClick={() => { setRejectModal(null); setRejectReason('') }} className="btn-ghost flex-1 py-3 text-sm">Batal</button>
              <button onClick={() => tolak(rejectModal)} disabled={!rejectReason.trim() || busy === rejectModal.id}
                className="flex-1 py-3 text-sm font-semibold rounded-xl transition-all disabled:opacity-30"
                style={{ background: '#ef4444', color: '#fff' }}>
                Konfirmasi Tolak
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

/* ══════════════════════════════
   TAB: Laporan
   ══════════════════════════════ */
function LaporanTab({ adminId }) {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState('')

  async function load() {
    // Get open reports grouped by job
    const { data } = await supabase
      .from('reports')
      .select('id, alasan, detail, status, job_id, jobs(judul, company_id, companies(nama))')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
    setReports(data || []); setLoading(false)
  }
  useEffect(() => { load() }, [])

  // Group by job_id
  const grouped = reports.reduce((acc, r) => {
    if (!acc[r.job_id]) acc[r.job_id] = { job: r.jobs, reports: [] }
    acc[r.job_id].reports.push(r)
    return acc
  }, {})

  async function tindak(jobId, jobTitle) {
    setBusy(jobId)
    await supabase.from('jobs').update({ status: 'closed' }).eq('id', jobId)
    await supabase.from('reports').update({ status: 'ditindak' }).eq('job_id', jobId).eq('status', 'open')
    await supabase.from('admin_logs').insert({
      admin_id: adminId, aksi: 'Tindak laporan', target_tipe: 'job', target_id: jobId,
      keterangan: `Menutup lowongan "${jobTitle}" berdasarkan laporan`,
    })
    setBusy(''); load()
  }

  async function tolakLaporan(jobId, jobTitle) {
    setBusy(jobId)
    await supabase.from('reports').update({ status: 'ditolak' }).eq('job_id', jobId).eq('status', 'open')
    await supabase.from('admin_logs').insert({
      admin_id: adminId, aksi: 'Tolak laporan', target_tipe: 'job', target_id: jobId,
      keterangan: `Menolak laporan untuk lowongan "${jobTitle}"`,
    })
    setBusy(''); load()
  }

  if (loading) return (
    <div className="space-y-3">
      {[1,2].map(i => <div key={i} className="card p-6"><div className="skeleton" style={{ height: 40, width: '60%' }} /></div>)}
    </div>
  )

  if (Object.keys(grouped).length === 0) return (
    <div className="card rounded-2xl py-20 text-center">
      <div className="text-4xl mb-3 opacity-30">🛡️</div>
      <p className="font-semibold" style={{ color: 'var(--text)' }}>Tidak Ada Laporan</p>
      <p className="text-sm mt-2" style={{ color: 'var(--muted)' }}>Belum ada laporan lowongan yang perlu ditindak.</p>
    </div>
  )

  return (
    <div className="space-y-3">
      {Object.entries(grouped).map(([jobId, { job, reports: reps }]) => (
        <div key={jobId} className="card p-5">
          <div className="flex flex-col sm:flex-row sm:items-start gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{job?.judul || 'Lowongan'}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{job?.companies?.nama || '-'}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs font-medium px-2 py-0.5 rounded-md"
                  style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', color: '#f87171' }}>
                  {reps.length} laporan
                </span>
              </div>
              <div className="mt-3 space-y-1">
                {reps.map(r => (
                  <div key={r.id} className="text-xs p-2 rounded-lg" style={{ background: 'var(--tag-bg)', border: '1px solid var(--border)' }}>
                    <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>{r.alasan}</span>
                    {r.detail && <span style={{ color: 'var(--muted)' }}> — {r.detail}</span>}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex sm:flex-col gap-2 shrink-0">
              <button onClick={() => tindak(jobId, job?.judul)} disabled={busy === jobId}
                className="flex-1 text-xs font-medium py-2 px-4 rounded-lg transition-all disabled:opacity-40"
                style={{ background: '#ef4444', color: '#fff' }}>
                Tindak
              </button>
              <button onClick={() => tolakLaporan(jobId, job?.judul)} disabled={busy === jobId}
                className="flex-1 text-xs font-medium py-2 px-4 rounded-lg transition-all disabled:opacity-40"
                style={{ background: 'var(--tag-bg)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                Tolak
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ══════════════════════════════
   TAB: Log Aktivitas
   ══════════════════════════════ */
function LogTab() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  async function load(reset = false) {
    const from = reset ? 0 : offset
    setLoading(true)
    const { data } = await supabase
      .from('admin_logs')
      .select('id, aksi, keterangan, created_at, admin_id, profiles:admin_id(nama)')
      .order('created_at', { ascending: false })
      .range(from, from + 49)
    if (reset) setLogs(data || [])
    else setLogs(prev => [...prev, ...(data || [])])
    setOffset(from + 50)
    setHasMore((data || []).length === 50)
    setLoading(false)
  }

  useEffect(() => { load(true) }, [])

  if (loading && logs.length === 0) return (
    <div className="space-y-2">
      {[1,2,3].map(i => <div key={i} className="card p-4"><div className="skeleton" style={{ height: 20, width: '70%' }} /></div>)}
    </div>
  )

  if (logs.length === 0) return (
    <div className="card rounded-2xl py-20 text-center">
      <p className="font-semibold" style={{ color: 'var(--text)' }}>Belum Ada Log</p>
      <p className="text-sm mt-2" style={{ color: 'var(--muted)' }}>Aktivitas admin akan dicatat di sini.</p>
    </div>
  )

  return (
    <div>
      <div className="space-y-1">
        {logs.map(log => (
          <div key={log.id} className="card p-3 sm:p-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
              style={{ background: 'var(--avatar-bg)', border: '1px solid var(--avatar-border)', color: 'var(--avatar-text)' }}>
              {log.profiles?.nama?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold" style={{ color: 'var(--text)' }}>{log.profiles?.nama || 'Admin'}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                  style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}>
                  {log.aksi}
                </span>
              </div>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{log.keterangan}</p>
              <p className="text-[10px] mt-1" style={{ color: 'var(--muted)' }}>
                {new Date(log.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
      </div>
      {hasMore && (
        <button onClick={() => load(false)} disabled={loading}
          className="btn-ghost w-full mt-4 py-3 text-sm">
          {loading ? 'Memuat...' : 'Muat Lagi'}
        </button>
      )}
    </div>
  )
}

/* ══════════════════════════════
   TAB: Statistik
   ══════════════════════════════ */
function StatistikTab() {
  const [appData, setAppData] = useState([])
  const [catData, setCatData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      // Applications per day (14 days)
      const since = new Date()
      since.setDate(since.getDate() - 14)
      const { data: apps } = await supabase
        .from('applications')
        .select('created_at')
        .gte('created_at', since.toISOString())

      const dayMap = {}
      for (let i = 13; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        const key = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
        dayMap[key] = 0
      }
      ;(apps || []).forEach(a => {
        const key = new Date(a.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
        if (key in dayMap) dayMap[key]++
      })
      setAppData(Object.entries(dayMap).map(([name, pelamar]) => ({ name, pelamar })))

      // Jobs per category
      const { data: jobsData } = await supabase.from('jobs').select('kategori')
      const catMap = {}
      ;(jobsData || []).forEach(j => {
        const k = j.kategori || 'Lainnya'
        catMap[k] = (catMap[k] || 0) + 1
      })
      setCatData(Object.entries(catMap).map(([name, jumlah]) => ({ name, jumlah })))

      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <div className="grid sm:grid-cols-2 gap-4">
      {[1,2].map(i => <div key={i} className="card p-6"><div className="skeleton" style={{ height: 200 }} /></div>)}
    </div>
  )

  return (
    <div className="grid sm:grid-cols-1 gap-4">
      {/* Line chart: applicants per day */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text)' }}>Pelamar per Hari (14 hari terakhir)</h3>
        {appData.length === 0 ? (
          <p className="text-xs py-10 text-center" style={{ color: 'var(--muted)' }}>Belum ada data</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={appData}>
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--muted)' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, color: 'var(--text)' }}
              />
              <Line type="monotone" dataKey="pelamar" stroke="var(--accent)" strokeWidth={2} dot={{ r: 3, fill: 'var(--accent)' }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Bar chart: jobs per category */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text)' }}>Lowongan per Kategori</h3>
        {catData.length === 0 ? (
          <p className="text-xs py-10 text-center" style={{ color: 'var(--muted)' }}>Belum ada data</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={catData}>
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--muted)' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, color: 'var(--text)' }}
                cursor={{ fill: 'var(--tag-bg)' }}
              />
              <Bar dataKey="jumlah" fill="#60a5fa" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
