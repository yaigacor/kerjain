import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const KATEGORI_LIST = ['Art & Design', 'Marketing', 'Technology', 'Finance', 'Education', 'Healthcare', 'Engineering']

const TAG_COLORS = [
  { bg: 'rgba(124,58,237,0.15)', border: 'rgba(124,58,237,0.3)', text: '#a78bfa' },
  { bg: 'rgba(6,214,160,0.1)',   border: 'rgba(6,214,160,0.3)',   text: '#34d399' },
  { bg: 'rgba(249,115,22,0.1)',  border: 'rgba(249,115,22,0.3)',  text: '#fb923c' },
  { bg: 'rgba(236,72,153,0.1)',  border: 'rgba(236,72,153,0.3)',  text: '#f472b6' },
  { bg: 'rgba(59,130,246,0.1)',  border: 'rgba(59,130,246,0.3)',  text: '#60a5fa' },
]

function Avatar({ name, size = 44 }) {
  const colors = [
    'linear-gradient(135deg,#7c3aed,#a855f7)',
    'linear-gradient(135deg,#06d6a0,#00f5c4)',
    'linear-gradient(135deg,#f472b6,#fb923c)',
    'linear-gradient(135deg,#3b82f6,#06d6a0)',
    'linear-gradient(135deg,#a855f7,#3b82f6)',
  ]
  const idx = (name?.charCodeAt(0) || 0) % colors.length
  return (
    <div style={{
      width: size, height: size, minWidth: size,
      borderRadius: size * 0.28,
      background: colors[idx],
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 900, fontSize: size * 0.38, color: '#fff',
      boxShadow: `0 4px 14px rgba(124,58,237,0.35)`,
    }}>
      {name?.charAt(0)?.toUpperCase() || '?'}
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex gap-4 items-center">
        <div className="skeleton" style={{ width: 44, height: 44, minWidth: 44, borderRadius: 12 }} />
        <div className="flex-1 space-y-2">
          <div className="skeleton" style={{ height: 16, width: '45%' }} />
          <div className="skeleton" style={{ height: 12, width: '30%' }} />
        </div>
        <div className="skeleton" style={{ height: 30, width: 80, borderRadius: 99 }} />
      </div>
    </div>
  )
}

export default function Jobs() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [lokasi, setLokasi] = useState('')
  const [kategori, setKategori] = useState('')

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      let query = supabase
        .from('jobs')
        .select('id, judul, lokasi, kategori, gaji, created_at, companies(nama)')
        .eq('status', 'open')
        .order('created_at', { ascending: false })
      if (q) query = query.ilike('judul', `%${q}%`)
      if (lokasi) query = query.ilike('lokasi', `%${lokasi}%`)
      if (kategori) query = query.ilike('kategori', `%${kategori}%`)
      const { data } = await query
      if (active) { setJobs(data || []); setLoading(false) }
    }
    load()
    return () => { active = false }
  }, [q, lokasi, kategori])

  return (
    <div>
     
      <section
        className="relative overflow-hidden py-20 px-4"
        style={{ background: 'linear-gradient(160deg, #0a0b18 0%, #0e0f24 40%, #07080f 100%)' }}
      >
       
        <div style={{ position:'absolute', top:-200, left:-150, width:600, height:600, borderRadius:'50%', background:'radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 70%)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:-200, right:-100, width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle, rgba(6,214,160,0.12) 0%, transparent 70%)', pointerEvents:'none' }} />
        <div className="grid-pattern absolute inset-0 opacity-30" />

        <div className="max-w-6xl mx-auto relative">
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-6"
            style={{ background:'rgba(124,58,237,0.15)', border:'1px solid rgba(124,58,237,0.3)', color:'#a78bfa' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
            {jobs.length > 0 ? `${jobs.length} Lowongan Tersedia` : 'Platform Karier #1'}
          </div>

          <h1 className="text-5xl sm:text-6xl font-black leading-[1.1] mb-5 text-white">
            Temukan Karier<br />
            <span className="grad-text">Impianmu</span>
            <br />
            <span className="text-white">Sekarang.</span>
          </h1>
          <p className="text-slate-500 mb-10 text-lg max-w-lg leading-relaxed">
            Ribuan lowongan dari perusahaan terbaik menunggumu. Lamar dalam hitungan detik.
          </p>

         
          <div className="glass-strong rounded-2xl p-2 flex flex-col sm:flex-row gap-2 max-w-2xl"
            style={{ boxShadow:'0 20px 60px rgba(124,58,237,0.15)' }}>
            <div className="flex items-center gap-3 flex-1 px-4">
              <svg className="w-4 h-4 shrink-0" style={{ color:'#7c3aed' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 outline-none py-2"
                placeholder="Posisi, perusahaan, atau kata kunci..."
                value={q}
                onChange={e => setQ(e.target.value)}
              />
            </div>
            <div className="hidden sm:block w-px" style={{ background:'rgba(255,255,255,0.08)', margin:'8px 0' }} />
            <div className="flex items-center gap-2 px-4">
              <svg className="w-4 h-4 shrink-0 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
              <input
                className="bg-transparent text-sm text-white placeholder-slate-500 outline-none py-2 w-28"
                placeholder="Lokasi..."
                value={lokasi}
                onChange={e => setLokasi(e.target.value)}
              />
            </div>
            <button className="btn-electric text-sm py-3 px-6">
              Cari →
            </button>
          </div>

          <div className="flex flex-wrap gap-2 mt-6">
            {['UI Designer', 'Backend Dev', 'Marketing', 'Remote', 'Finance'].map((t, i) => (
              <button
                key={t}
                onClick={() => setQ(t)}
                className="text-xs font-semibold px-3 py-1.5 rounded-full transition-all hover:scale-105"
                style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', color:'#94a3b8' }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section style={{ background:'rgba(255,255,255,0.02)', borderTop:'1px solid rgba(255,255,255,0.05)', borderBottom:'1px solid rgba(255,255,255,0.05)', padding:'16px 0' }}>
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-center gap-10 flex-wrap">
          <span className="text-slate-600 text-xs font-bold tracking-widest uppercase mr-4">Dipercaya oleh</span>
          {['Stripe', 'Google', 'Tokopedia', 'Gojek', 'Shopee', 'Traveloka'].map(n => (
            <span key={n} className="text-slate-500 font-black text-sm tracking-wide hover:text-slate-300 transition-colors cursor-default">{n}</span>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-col lg:flex-row gap-8">

         
          <aside className="lg:w-52 shrink-0">
            <p className="text-xs font-black text-slate-600 uppercase tracking-widest mb-3">Filter Kategori</p>
            <div className="space-y-1">
              {['Semua', ...KATEGORI_LIST].map(k => {
                const active = k === 'Semua' ? kategori === '' : kategori === k
                return (
                  <button
                    key={k}
                    onClick={() => setKategori(k === 'Semua' ? '' : (k === kategori ? '' : k))}
                    className="w-full text-left text-sm px-3 py-2.5 rounded-xl transition-all font-semibold"
                    style={active
                      ? { background:'linear-gradient(135deg,rgba(124,58,237,0.25),rgba(168,85,247,0.15))', color:'#c4b5fd', border:'1px solid rgba(124,58,237,0.4)' }
                      : { color:'#64748b', border:'1px solid transparent' }
                    }
                  >
                    {k}
                  </button>
                )
              })}
            </div>
          </aside>

        
          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-black text-white">Lowongan Terbaru</h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  {loading ? 'Memuat...' : `${jobs.length} lowongan ditemukan`}
                </p>
              </div>
              {kategori && (
                <button
                  onClick={() => setKategori('')}
                  className="text-xs font-bold px-3 py-1.5 rounded-full"
                  style={{ background:'rgba(124,58,237,0.15)', color:'#a78bfa', border:'1px solid rgba(124,58,237,0.3)' }}
                >
                  {kategori} ✕
                </button>
              )}
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1,2,3,4].map(i => <SkeletonCard key={i} />)}
              </div>
            ) : jobs.length === 0 ? (
              <div className="glass rounded-3xl py-20 text-center">
                <p className="text-white font-bold text-lg">Tidak Ada Hasil</p>
                <p className="text-slate-500 text-sm mt-2">Coba kata kunci atau filter berbeda</p>
                <button onClick={() => { setQ(''); setLokasi(''); setKategori('') }} className="mt-5 btn-ghost text-sm py-2 px-5" style={{ borderRadius:12 }}>
                  Reset Filter
                </button>
              </div>
            ) : (
              <ul className="space-y-3">
                {jobs.map((j, idx) => {
                  const tag = TAG_COLORS[idx % TAG_COLORS.length]
                  return (
                    <li key={j.id}>
                      <Link
                        to={`/lowongan/${j.id}`}
                        className="job-card glass rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4 block"
                        style={{ border:'1px solid rgba(255,255,255,0.06)' }}
                      >
                        <Avatar name={j.companies?.nama} />
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-white text-base leading-tight">{j.judul}</p>
                          <p className="text-sm text-slate-500 mt-1">
                            {j.companies?.nama}
                            {j.lokasi && <> · <span className="text-slate-400">{j.lokasi}</span></>}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-3">
                            {j.kategori && (
                              <span className="badge text-xs" style={{ background: tag.bg, border:`1px solid ${tag.border}`, color: tag.text }}>
                                {j.kategori}
                              </span>
                            )}
                            <span className="badge text-xs" style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', color:'#64748b' }}>
                              Full-time
                            </span>
                          </div>
                        </div>
                        <div className="shrink-0 text-right sm:text-right">
                          {j.gaji ? (
                            <p className="font-black text-white text-sm">
                              Rp {Number(j.gaji).toLocaleString('id-ID')}
                            </p>
                          ) : (
                            <p className="text-slate-600 text-xs font-semibold italic">Nego</p>
                          )}
                          <span
                            className="inline-block mt-2 text-xs font-bold px-3 py-1.5 rounded-full"
                            style={{ background:'rgba(6,214,160,0.12)', color:'#06d6a0', border:'1px solid rgba(6,214,160,0.3)' }}
                          >
                            Lamar →
                          </span>
                        </div>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
