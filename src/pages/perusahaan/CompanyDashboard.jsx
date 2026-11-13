import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

const KATEGORI_LIST = ['Art & Design', 'Marketing', 'Technology', 'Finance', 'Education', 'Healthcare', 'Engineering']

const STATUS = {
  pending:  { label: 'Menunggu verifikasi', cls: 'text-amber-300 bg-amber-400/10 border-amber-400/30' },
  approved: { label: 'Terverifikasi',       cls: 'text-emerald-300 bg-emerald-400/10 border-emerald-400/30' },
  rejected: { label: 'Ditolak',             cls: 'text-red-300 bg-red-400/10 border-red-400/30' },
}

function Field({ label, as: Tag = 'input', children, ...props }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-slate-400 mb-1.5">{label}</span>
      <Tag className={`input-dark ${Tag === 'textarea' ? 'resize-none' : ''}`} {...props}>{children}</Tag>
    </label>
  )
}

const EMPTY_JOB = { judul: '', lokasi: '', kategori: '', gaji: '', deskripsi: '' }

export default function CompanyDashboard() {
  const { user } = useAuth()
  const [company, setCompany] = useState(null)
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState(null) 
  const [cForm, setCForm] = useState({ nama: '', alamat: '', deskripsi: '' })
  const [jForm, setJForm] = useState(EMPTY_JOB)

  async function load() {
    const { data: c, error } = await supabase
      .from('companies')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (error) setNotice({ type: 'error', text: error.message })
    setCompany(c)
    if (c) {
      const { data: j } = await supabase
        .from('jobs').select('*').eq('company_id', c.id).order('created_at', { ascending: false })
      setJobs(j || [])
    } else {
      setJobs([])
    }
    setLoading(false)
  }

 
  useEffect(() => {
    load()
    const onFocus = () => load()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])

  async function createCompany(e) {
    e.preventDefault()
    setBusy(true); setNotice(null)
    const { data, error } = await supabase
      .from('companies').insert({ ...cForm, owner_id: user.id }).select().single()
    setBusy(false)
    if (error) setNotice({ type: 'error', text: error.message })
    else setCompany(data)
  }

  async function createJob(e) {
    e.preventDefault()
    setBusy(true); setNotice(null)
    const payload = { ...jForm, company_id: company.id, gaji: jForm.gaji ? Number(jForm.gaji) : null }
    const { error } = await supabase.from('jobs').insert(payload)
    setBusy(false)
    if (error) setNotice({ type: 'error', text: error.message })
    else {
      setNotice({ type: 'ok', text: 'Lowongan berhasil dipasang.' })
      setJForm(EMPTY_JOB)
      load()
    }
  }

  async function setJobStatus(id, status) {
    await supabase.from('jobs').update({ status }).eq('id', id)
    load()
  }

  const noticeBox = notice && (
    <div className={`text-sm rounded-lg px-3 py-2 border ${
      notice.type === 'ok'
        ? 'text-emerald-300 bg-emerald-400/10 border-emerald-400/30'
        : 'text-red-300 bg-red-400/10 border-red-400/30'
    }`}>
      {notice.text}
    </div>
  )

  if (loading) return <p className="text-center text-slate-400 py-20">Memuat dashboard...</p>


  if (!company) return (
    <div className="max-w-md mx-auto px-4 py-10">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h1 className="text-xl font-bold text-white">Daftarkan perusahaan</h1>
        <p className="text-sm text-slate-400 mt-1 mb-5">Lengkapi profil untuk mulai memasang lowongan.</p>
        <form onSubmit={createCompany} className="space-y-4">
          {noticeBox}
          <Field label="Nama perusahaan" placeholder="PT. Contoh Indonesia" required
            value={cForm.nama} onChange={e => setCForm({ ...cForm, nama: e.target.value })} />
          <Field label="Alamat" placeholder="Jl. Sudirman No. 1, Palembang"
            value={cForm.alamat} onChange={e => setCForm({ ...cForm, alamat: e.target.value })} />
          <Field as="textarea" rows={3} label="Deskripsi" placeholder="Ceritakan singkat tentang perusahaanmu"
            value={cForm.deskripsi} onChange={e => setCForm({ ...cForm, deskripsi: e.target.value })} />
          <button disabled={busy} className="btn-electric w-full text-sm" style={{ padding: '12px', borderRadius: 12 }}>
            {busy ? 'Menyimpan...' : 'Daftarkan perusahaan'}
          </button>
        </form>
      </div>
    </div>
  )

  const st = STATUS[company.status] || STATUS.pending
  const aktif = jobs.filter(j => j.status === 'open').length

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="flex flex-wrap items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-violet-600 flex items-center justify-center text-lg font-bold text-white shrink-0">
            {company.nama?.charAt(0)?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-white truncate">{company.nama}</h1>
            {company.alamat && <p className="text-sm text-slate-400 truncate">{company.alamat}</p>}
          </div>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${st.cls}`}>{st.label}</span>
          <button onClick={load} className="btn-ghost text-sm" style={{ padding: '6px 14px', borderRadius: 10 }}>
            Muat ulang
          </button>
        </div>

        {company.status === 'pending' && (
          <p className="mt-4 text-sm text-amber-200/90">
            Perusahaanmu sedang menunggu verifikasi admin. Lowongan bisa dipasang setelah disetujui.
          </p>
        )}
        {company.status === 'rejected' && (
          <p className="mt-4 text-sm text-red-300">
            Pengajuan ditolak{company.rejection_reason ? `: ${company.rejection_reason}` : '.'}
          </p>
        )}
      </div>

    
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total lowongan', value: jobs.length },
          { label: 'Aktif', value: aktif },
          { label: 'Ditutup', value: jobs.length - aktif },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
            <p className="text-2xl font-bold text-white">{s.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {company.status === 'approved' && (
        <div className="grid gap-6 lg:grid-cols-5">

          <form onSubmit={createJob} className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4 self-start">
            <h2 className="font-semibold text-white">Pasang lowongan</h2>
            {noticeBox}
            <Field label="Judul posisi" placeholder="Contoh: Frontend Developer" required
              value={jForm.judul} onChange={e => setJForm({ ...jForm, judul: e.target.value })} />
            <Field label="Lokasi" placeholder="Palembang"
              value={jForm.lokasi} onChange={e => setJForm({ ...jForm, lokasi: e.target.value })} />
            <Field as="select" label="Kategori"
              value={jForm.kategori} onChange={e => setJForm({ ...jForm, kategori: e.target.value })}>
              <option value="" className="bg-slate-900">Pilih kategori</option>
              {KATEGORI_LIST.map(k => <option key={k} value={k} className="bg-slate-900">{k}</option>)}
            </Field>
            <Field label="Gaji (Rp)" type="number" min="0" placeholder="5000000"
              value={jForm.gaji} onChange={e => setJForm({ ...jForm, gaji: e.target.value })} />
            <Field as="textarea" rows={4} label="Deskripsi pekerjaan" placeholder="Tanggung jawab, kualifikasi, benefit"
              value={jForm.deskripsi} onChange={e => setJForm({ ...jForm, deskripsi: e.target.value })} />
            <button disabled={busy} className="btn-electric w-full text-sm" style={{ padding: '12px', borderRadius: 12 }}>
              {busy ? 'Memasang...' : 'Pasang lowongan'}
            </button>
          </form>

          <div className="lg:col-span-3">
            <h2 className="font-semibold text-white mb-3">Lowongan saya</h2>
            {jobs.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/15 py-12 text-center text-sm text-slate-500">
                Belum ada lowongan. Isi form di samping untuk memasang yang pertama.
              </div>
            ) : (
              <ul className="space-y-2">
                {jobs.map(j => (
                  <li key={j.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white truncate">{j.judul}</p>
                      <p className="text-xs text-slate-400 mt-0.5 truncate">
                        {[j.lokasi, j.kategori, j.gaji && `Rp ${Number(j.gaji).toLocaleString('id-ID')}`].filter(Boolean).join(' · ') || 'Tanpa detail'}
                      </p>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full border ${
                      j.status === 'open'
                        ? 'text-emerald-300 bg-emerald-400/10 border-emerald-400/30'
                        : 'text-slate-400 bg-white/5 border-white/10'
                    }`}>
                      {j.status === 'open' ? 'Aktif' : 'Ditutup'}
                    </span>
                    <button
                      onClick={() => setJobStatus(j.id, j.status === 'open' ? 'closed' : 'open')}
                      className="text-xs text-slate-300 hover:text-white underline underline-offset-2"
                    >
                      {j.status === 'open' ? 'Tutup' : 'Buka lagi'}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

    </div>
  )
}