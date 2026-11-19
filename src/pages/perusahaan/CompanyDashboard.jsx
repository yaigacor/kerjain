import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

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

export default function CompanyDashboard() {
  const { user } = useAuth()
  const [company, setCompany] = useState(null)
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [cForm, setCForm] = useState({ nama: '', deskripsi: '', alamat: '' })
  const [jForm, setJForm] = useState({ judul: '', deskripsi: '', lokasi: '', kategori: '', gaji: '' })
  const [msg, setMsg] = useState('')
  const [activeTab, setActiveTab] = useState('pasang')

  async function load() {
    const { data: c } = await supabase.from('companies').select('*').eq('owner_id', user.id).maybeSingle()
    setCompany(c)
    if (c) {
      const { data: j } = await supabase.from('jobs').select('*').eq('company_id', c.id).order('created_at', { ascending: false })
      setJobs(j || [])
    }
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function createCompany(e) {
    e.preventDefault()
    const { error } = await supabase.from('companies').insert({ ...cForm, owner_id: user.id })
    if (error) setMsg(error.message); else load()
  }

  async function createJob(e) {
    e.preventDefault()
    const payload = { ...jForm, company_id: company.id, gaji: jForm.gaji ? Number(jForm.gaji) : null }
    const { error } = await supabase.from('jobs').insert(payload)
    if (error) setMsg(error.message)
    else {
      setMsg('Lowongan berhasil dipasang!')
      setJForm({ judul: '', deskripsi: '', lokasi: '', kategori: '', gaji: '' })
      setActiveTab('lowongan')
      load()
    }
  }

  async function closeJob(id) {
    await supabase.from('jobs').update({ status: 'closed' }).eq('id', id)
    load()
  }

  if (loading) return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="text-center">
        <div className="relative w-12 h-12 mx-auto mb-4">
          <div className="loading-ring" />
        </div>
        <p className="text-neutral-600 text-sm">Memuat dashboard...</p>
      </div>
    </div>
  )

  // ── No company yet ──
  if (!company) return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <div className="card-elevated p-8">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.08)' }}>
            <span className="text-2xl">🏢</span>
          </div>
          <h1 className="text-xl font-bold text-white">Daftarkan Perusahaanmu</h1>
          <p className="text-neutral-600 text-sm mt-2">Lengkapi profil untuk mulai memasang lowongan</p>
        </div>
        {msg && <div className="text-red-400 text-sm p-3 rounded-lg mb-4" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>{msg}</div>}
        <form onSubmit={createCompany} className="space-y-4">
          <InputField label="Nama Perusahaan" placeholder="PT. Contoh Indonesia" value={cForm.nama} onChange={e => setCForm({ ...cForm, nama: e.target.value })} required />
          <InputField label="Alamat" placeholder="Jl. Sudirman No.1, Jakarta" value={cForm.alamat} onChange={e => setCForm({ ...cForm, alamat: e.target.value })} />
          <InputField textarea label="Deskripsi" placeholder="Ceritakan tentang perusahaanmu..." value={cForm.deskripsi} onChange={e => setCForm({ ...cForm, deskripsi: e.target.value })} />
          <button className="btn-accent w-full py-3">Daftarkan Perusahaan</button>
        </form>
      </div>
    </div>
  )

  const STATUS_BADGE = {
    pending:  { bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.2)', color: '#fbbf24', label: '⏳ Menunggu Verifikasi' },
    approved: { bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)', color: '#10b981', label: '✓ Terverifikasi' },
    rejected: { bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)', color: '#f87171', label: '✕ Ditolak' },
  }
  const sb = STATUS_BADGE[company.status] || STATUS_BADGE.pending

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-5">
      {/* Company Hero */}
      <div className="card-elevated p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl text-white shrink-0"
            style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)' }}>
            {company.nama?.charAt(0)?.toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white">{company.nama}</h1>
            {company.alamat && <p className="text-neutral-600 text-sm mt-0.5">📍 {company.alamat}</p>}
          </div>
          <span className="self-start text-xs font-medium px-3 py-1.5 rounded-lg"
            style={{ background: sb.bg, border: `1px solid ${sb.border}`, color: sb.color }}>
            {sb.label}
          </span>
        </div>
        {company.status === 'pending' && (
          <p className="mt-5 text-sm font-medium px-4 py-3 rounded-xl"
            style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.15)', color: '#fde68a' }}>
            Perusahaanmu sedang menunggu verifikasi admin. Lowongan bisa dipasang setelah disetujui.
          </p>
        )}
        {company.status === 'rejected' && (
          <p className="mt-5 text-sm font-medium px-4 py-3 rounded-xl"
            style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', color: '#fca5a5' }}>
            Ditolak: {company.rejection_reason}
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Lowongan', value: jobs.length, color: '#a3a3a3' },
          { label: 'Aktif', value: jobs.filter(j => j.status === 'open').length, color: '#10b981' },
          { label: 'Ditutup', value: jobs.filter(j => j.status === 'closed').length, color: '#525252' },
        ].map(s => (
          <div key={s.label} className="card p-5 text-center">
            <p className="text-2xl font-bold text-white">{s.value}</p>
            <p className="text-xs font-medium mt-1" style={{ color: s.color }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      {company.status === 'approved' && (
        <div className="card overflow-hidden">
          <div className="flex" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            {[
              { key: 'pasang', label: '+ Pasang Lowongan' },
              { key: 'lowongan', label: `Lowongan (${jobs.length})` },
            ].map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                className="flex-1 py-3.5 text-sm font-medium transition-all"
                style={activeTab === t.key
                  ? { color: '#f5f5f5', borderBottom: '2px solid #10b981', background: 'rgba(16,185,129,0.04)' }
                  : { color: '#525252', borderBottom: '2px solid transparent' }
                }>
                {t.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === 'pasang' && (
              <form onSubmit={createJob} className="space-y-4 max-w-xl">
                {msg && (
                  <div className="text-emerald-400 text-sm p-3 rounded-lg" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)' }}>{msg}</div>
                )}
                <InputField label="Judul Posisi" placeholder="contoh: Senior UI/UX Designer" value={jForm.judul} onChange={e => setJForm({...jForm, judul: e.target.value})} required />
                <div className="grid grid-cols-3 gap-3">
                  <InputField label="Lokasi" placeholder="Jakarta" value={jForm.lokasi} onChange={e => setJForm({...jForm, lokasi: e.target.value})} />
                  <InputField label="Kategori" placeholder="Technology" value={jForm.kategori} onChange={e => setJForm({...jForm, kategori: e.target.value})} />
                  <InputField label="Gaji (Rp)" type="number" placeholder="5000000" value={jForm.gaji} onChange={e => setJForm({...jForm, gaji: e.target.value})} />
                </div>
                <InputField textarea label="Deskripsi Pekerjaan" placeholder="Tanggung jawab, kualifikasi, benefit..." value={jForm.deskripsi} onChange={e => setJForm({...jForm, deskripsi: e.target.value})} />
                <button className="btn-accent py-3 px-6 text-sm font-semibold">
                  Pasang Lowongan
                </button>
              </form>
            )}

            {activeTab === 'lowongan' && (
              jobs.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-neutral-600 font-medium">Belum ada lowongan.</p>
                  <button onClick={() => setActiveTab('pasang')}
                    className="mt-3 text-sm font-semibold" style={{ color: '#10b981' }}>
                    + Pasang Lowongan Pertama
                  </button>
                </div>
              ) : (
                <ul className="space-y-2">
                  {jobs.map(j => (
                    <li key={j.id} className="flex items-center gap-4 p-4 rounded-xl transition-all hover:bg-white/[0.02]"
                      style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white text-sm truncate">{j.judul}</p>
                        <p className="text-xs text-neutral-700 mt-0.5">
                          {j.lokasi && `📍 ${j.lokasi}`}{j.kategori && ` · ${j.kategori}`}
                          {j.gaji && ` · Rp ${Number(j.gaji).toLocaleString('id-ID')}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-medium px-3 py-1.5 rounded-lg"
                          style={j.status === 'open'
                            ? { background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', color: '#10b981' }
                            : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#525252' }
                          }>
                          {j.status === 'open' ? '● Aktif' : '● Tutup'}
                        </span>
                        {j.status === 'open' && (
                          <button onClick={() => closeJob(j.id)}
                            className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                            style={{ border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', background: 'rgba(239,68,68,0.06)' }}>
                            Tutup
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )
            )}
          </div>
        </div>
      )}
    </div>
  )
}
