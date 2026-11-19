import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const KATEGORI_LIST = ['Art & Design', 'Marketing', 'Technology', 'Finance', 'Education', 'Healthcare', 'Engineering']

function Avatar({ name, size = 40 }) {
  return (
    <div style={{
      width: size, height: size, minWidth: size,
      borderRadius: '50%',
      background: '#1a1a1a',
      border: '1px solid rgba(255,255,255,0.08)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 600, fontSize: size * 0.35, color: '#a3a3a3',
    }}>
      {name?.charAt(0)?.toUpperCase() || '?'}
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="card p-5">
      <div className="flex gap-4 items-center">
        <div className="skeleton" style={{ width: 40, height: 40, borderRadius: '50%' }} />
        <div className="flex-1 space-y-2">
          <div className="skeleton" style={{ height: 14, width: '45%' }} />
          <div className="skeleton" style={{ height: 11, width: '30%' }} />
        </div>
        <div className="skeleton" style={{ height: 28, width: 72, borderRadius: 8 }} />
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
      {/* Hero */}
      <section className="relative overflow-hidden pt-20 pb-16 px-4">
        {/* Subtle radial glow */}
        <div style={{
          position: 'absolute', top: '-30%', left: '50%', transform: 'translateX(-50%)',
          width: '800px', height: '600px', borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(16,185,129,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div className="max-w-6xl mx-auto relative">
          {/* Status badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-6"
            style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', color: '#10b981' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
            {jobs.length > 0 ? `${jobs.length} lowongan tersedia` : 'Platform Karier #1'}
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] mb-5 tracking-tight">
            <span className="text-white">Temukan Karier</span><br />
            <span className="text-white">Impianmu</span>{' '}
            <span style={{ color: '#10b981' }}>Sekarang.</span>
          </h1>
          <p className="text-neutral-500 mb-10 text-base sm:text-lg max-w-lg leading-relaxed">
            Ribuan lowongan dari perusahaan terbaik menunggumu. Lamar dalam hitungan detik.
          </p>

          {/* Search bar */}
          <div className="card-elevated p-1.5 flex flex-col sm:flex-row gap-1.5 max-w-2xl">
            <div className="flex items-center gap-3 flex-1 px-3">
              <svg className="w-4 h-4 shrink-0 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                className="flex-1 bg-transparent text-sm text-white placeholder-neutral-600 outline-none py-2.5"
                placeholder="Posisi, perusahaan, atau kata kunci..."
                value={q}
                onChange={e => setQ(e.target.value)}
              />
            </div>
            <div className="hidden sm:block w-px self-stretch" style={{ background: 'rgba(255,255,255,0.06)', margin: '6px 0' }} />
            <div className="flex items-center gap-2 px-3">
              <svg className="w-4 h-4 shrink-0 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
              <input
                className="bg-transparent text-sm text-white placeholder-neutral-600 outline-none py-2.5 w-28"
                placeholder="Lokasi..."
                value={lokasi}
                onChange={e => setLokasi(e.target.value)}
              />
            </div>
            <button className="btn-accent text-sm py-2.5 px-5 whitespace-nowrap">
              Cari Lowongan
            </button>
          </div>

          {/* Quick tags */}
          <div className="flex flex-wrap gap-2 mt-5">
            {['UI Designer', 'Backend Dev', 'Marketing', 'Remote', 'Finance'].map(t => (
              <button
                key={t}
                onClick={() => setQ(t)}
                className="text-xs font-medium px-3 py-1.5 rounded-lg transition-all hover:bg-white/10"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: '#737373' }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Trusted by */}
      <section className="section-divider" style={{ padding: '14px 0' }}>
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-center gap-8 sm:gap-12 flex-wrap">
          <span className="text-neutral-700 text-xs font-medium tracking-widest uppercase">Dipercaya oleh</span>
          {['Stripe', 'Google', 'Tokopedia', 'Gojek', 'Shopee', 'Traveloka'].map(n => (
            <span key={n} className="text-neutral-600 font-semibold text-sm tracking-wide hover:text-neutral-400 transition-colors cursor-default">{n}</span>
          ))}
        </div>
      </section>

      {/* Job listings */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Filter sidebar */}
          <aside className="lg:w-48 shrink-0">
            <p className="text-xs font-semibold text-neutral-600 uppercase tracking-widest mb-3">Kategori</p>
            <div className="space-y-0.5">
              {['Semua', ...KATEGORI_LIST].map(k => {
                const active = k === 'Semua' ? kategori === '' : kategori === k
                return (
                  <button
                    key={k}
                    onClick={() => setKategori(k === 'Semua' ? '' : (k === kategori ? '' : k))}
                    className="w-full text-left text-sm px-3 py-2 rounded-lg transition-all font-medium"
                    style={active
                      ? { background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }
                      : { color: '#525252', border: '1px solid transparent' }
                    }
                  >
                    {k}
                  </button>
                )
              })}
            </div>
          </aside>

          {/* Jobs list */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-white">Lowongan Terbaru</h2>
                <p className="text-sm text-neutral-600 mt-0.5">
                  {loading ? 'Memuat...' : `${jobs.length} lowongan ditemukan`}
                </p>
              </div>
              {kategori && (
                <button
                  onClick={() => setKategori('')}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg"
                  style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}
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
              <div className="card rounded-2xl py-20 text-center">
                <div className="text-4xl mb-4 opacity-40"></div>
                <p className="text-white font-semibold text-base">Tidak Ada Hasil</p>
                <p className="text-neutral-600 text-sm mt-2">Coba kata kunci atau filter berbeda</p>
                <button onClick={() => { setQ(''); setLokasi(''); setKategori('') }} className="mt-5 btn-ghost text-sm py-2 px-5">
                  Reset Filter
                </button>
              </div>
            ) : (
              <ul className="space-y-2">
                {jobs.map(j => (
                  <li key={j.id}>
                    <Link
                      to={`/lowongan/${j.id}`}
                      className="job-card card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 block"
                    >
                      <Avatar name={j.companies?.nama} />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white text-sm leading-tight">{j.judul}</p>
                        <p className="text-sm text-neutral-600 mt-1">
                          {j.companies?.nama}
                          {j.lokasi && <> · <span className="text-neutral-500">{j.lokasi}</span></>}
                        </p>
                        <div className="flex flex-wrap gap-1.5 mt-2.5">
                          {j.kategori && (
                            <span className="badge text-xs" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#737373' }}>
                              {j.kategori}
                            </span>
                          )}
                          <span className="badge text-xs" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#525252' }}>
                            Full-time
                          </span>
                        </div>
                      </div>
                      <div className="shrink-0 text-right sm:text-right">
                        {j.gaji ? (
                          <p className="font-semibold text-white text-sm">
                            Rp {Number(j.gaji).toLocaleString('id-ID')}
                          </p>
                        ) : (
                          <p className="text-neutral-600 text-xs font-medium italic">Nego</p>
                        )}
                        <span
                          className="inline-block mt-2 text-xs font-medium px-3 py-1.5 rounded-lg"
                          style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}
                        >
                          Lamar →
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="section-divider py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-neutral-700 text-xs font-medium">
            © 2024 Kerjain. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <span className="text-neutral-700 text-xs hover:text-neutral-500 cursor-pointer transition-colors">Tentang</span>
            <span className="text-neutral-700 text-xs hover:text-neutral-500 cursor-pointer transition-colors">Kontak</span>
            <span className="text-neutral-700 text-xs hover:text-neutral-500 cursor-pointer transition-colors">Privasi</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
