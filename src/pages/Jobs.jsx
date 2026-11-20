import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const KATEGORI_LIST = ['Art & Design', 'Marketing', 'Technology', 'Finance', 'Education', 'Healthcare', 'Engineering']

function Avatar({ name, size = 40 }) {
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

function SkeletonCard() {
  return (
    <div className="card p-4">
      <div className="flex gap-3 items-center">
        <div className="skeleton" style={{ width: 40, height: 40, borderRadius: '50%' }} />
        <div className="flex-1 space-y-2">
          <div className="skeleton" style={{ height: 14, width: '55%' }} />
          <div className="skeleton" style={{ height: 11, width: '35%' }} />
        </div>
        <div className="skeleton hidden sm:block" style={{ height: 28, width: 72, borderRadius: 8 }} />
      </div>
    </div>
  )
}

function MiniStars({ avg, count }) {
  if (!count) return <span className="text-[10px]" style={{ color: 'var(--muted)' }}>Belum ada rating</span>
  return (
    <span className="inline-flex items-center gap-0.5 text-[10px]" style={{ color: '#fbbf24' }}>
      <svg width={10} height={10} viewBox="0 0 24 24" fill="#fbbf24" stroke="none">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
      {avg?.toFixed(1)} <span style={{ color: 'var(--muted)' }}>({count})</span>
    </span>
  )
}

export default function Jobs() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [kategori, setKategori] = useState('')
  const [showFilter, setShowFilter] = useState(false)
  const [companyRatings, setCompanyRatings] = useState({}) // { company_id: { avg, count } }

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      let query = supabase
        .from('jobs')
        .select('id, judul, lokasi, kategori, gaji, created_at, company_id, companies(nama)')
        .eq('status', 'open')
        .order('created_at', { ascending: false })
      if (q) query = query.or(`judul.ilike.%${q}%,lokasi.ilike.%${q}%,kategori.ilike.%${q}%`)
      if (kategori) query = query.ilike('kategori', `%${kategori}%`)
      const { data } = await query
      if (active) { setJobs(data || []); setLoading(false) }

      // Load company ratings
      const { data: ratingsData } = await supabase.from('company_rating_summary').select('*')
      if (active && ratingsData) {
        const map = {}
        ratingsData.forEach(r => { map[r.company_id] = { avg: r.rata2, count: r.jumlah } })
        setCompanyRatings(map)
      }
    }
    load()
    return () => { active = false }
  }, [q, kategori])

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden pt-16 sm:pt-20 pb-12 sm:pb-16 px-4">
        <div style={{
          position: 'absolute', top: '-30%', left: '50%', transform: 'translateX(-50%)',
          width: '800px', height: '600px', borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(16,185,129,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div className="max-w-6xl mx-auto relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-5 sm:mb-6"
            style={{ background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', color: 'var(--accent)' }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse inline-block" style={{ background: 'var(--accent)' }} />
            {jobs.length > 0 ? `${jobs.length} lowongan tersedia` : 'Platform Karier #1'}
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] mb-4 sm:mb-5 tracking-tight">
            <span style={{ color: 'var(--text)' }}>Temukan Karier</span><br />
            <span style={{ color: 'var(--text)' }}>Impianmu</span>{' '}
            <span style={{ color: 'var(--accent)' }}>Sekarang.</span>
          </h1>
          <p className="mb-8 sm:mb-10 text-sm sm:text-lg max-w-lg leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Ribuan lowongan dari perusahaan terbaik menunggumu. Lamar dalam hitungan detik.
          </p>

          {/* Search bar */}
          <div className="card-elevated p-1.5 flex items-center gap-1.5 max-w-xl">
            <div className="flex items-center gap-3 flex-1 px-3">
              <svg className="w-4 h-4 shrink-0" style={{ color: 'var(--muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                className="flex-1 bg-transparent text-sm placeholder-current outline-none py-2.5 min-w-0"
                style={{ color: 'var(--text)', '--placeholder-color': 'var(--muted)' }}
                placeholder="Cari posisi, perusahaan, lokasi..."
                value={q} onChange={e => setQ(e.target.value)}
              />
              {q && (
                <button onClick={() => setQ('')} style={{ color: 'var(--muted)' }}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <button className="btn-accent text-sm py-2.5 px-5 whitespace-nowrap shrink-0">Cari</button>
          </div>

          <div className="flex flex-wrap gap-2 mt-4 sm:mt-5">
            {['UI Designer', 'Backend Dev', 'Marketing', 'Remote', 'Finance'].map(t => (
              <button key={t} onClick={() => setQ(t)}
                className="text-xs font-medium px-3 py-1.5 rounded-lg transition-all active:scale-95"
                style={{ background: 'var(--tag-bg)', border: '1px solid var(--tag-border)', color: 'var(--tag-text)' }}>
                {t}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Trusted by */}
      <section className="section-divider hidden sm:block" style={{ padding: '14px 0' }}>
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-center gap-8 sm:gap-12 flex-wrap">
          <span className="text-xs font-medium tracking-widest uppercase" style={{ color: 'var(--muted)' }}>Dipercaya oleh</span>
          {['Stripe', 'Google', 'Tokopedia', 'Gojek', 'Shopee', 'Traveloka'].map(n => (
            <span key={n} className="font-semibold text-sm tracking-wide" style={{ color: 'var(--text-secondary)' }}>{n}</span>
          ))}
        </div>
      </section>

      {/* Job listings */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">

          {/* Mobile filter toggle */}
          <div className="lg:hidden flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold" style={{ color: 'var(--text)' }}>Lowongan Terbaru</h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                {loading ? 'Memuat...' : `${jobs.length} lowongan ditemukan`}
              </p>
            </div>
            <button onClick={() => setShowFilter(!showFilter)}
              className="flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg transition-all"
              style={{
                background: showFilter ? 'var(--accent-soft)' : 'var(--tag-bg)',
                border: `1px solid ${showFilter ? 'var(--accent-border)' : 'var(--tag-border)'}`,
                color: showFilter ? 'var(--accent)' : 'var(--tag-text)',
              }}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filter
            </button>
          </div>

          {/* Filter sidebar */}
          <aside className={`lg:w-48 shrink-0 ${showFilter ? 'block' : 'hidden lg:block'}`}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-3 hidden lg:block" style={{ color: 'var(--muted)' }}>Kategori</p>
            <div className="flex lg:flex-col gap-1.5 lg:gap-0.5 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 -mx-1 px-1 lg:mx-0 lg:px-0 no-scrollbar">
              {['Semua', ...KATEGORI_LIST].map(k => {
                const active = k === 'Semua' ? kategori === '' : kategori === k
                return (
                  <button key={k}
                    onClick={() => { setKategori(k === 'Semua' ? '' : (k === kategori ? '' : k)); setShowFilter(false) }}
                    className="text-sm px-3 py-2 rounded-lg transition-all font-medium whitespace-nowrap shrink-0 lg:w-full lg:text-left"
                    style={active
                      ? { background: 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }
                      : { color: 'var(--muted)', border: '1px solid transparent' }}>
                    {k}
                  </button>
                )
              })}
            </div>
          </aside>

          {/* Jobs list */}
          <div className="flex-1 min-w-0">
            <div className="hidden lg:flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Lowongan Terbaru</h2>
                <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>
                  {loading ? 'Memuat...' : `${jobs.length} lowongan ditemukan`}
                </p>
              </div>
              {kategori && (
                <button onClick={() => setKategori('')}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg"
                  style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}>
                  {kategori} ✕
                </button>
              )}
            </div>

            {kategori && (
              <div className="lg:hidden mb-4">
                <button onClick={() => setKategori('')}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg"
                  style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}>
                  {kategori} ✕
                </button>
              </div>
            )}

            {loading ? (
              <div className="space-y-2">{[1,2,3,4].map(i => <SkeletonCard key={i} />)}</div>
            ) : jobs.length === 0 ? (
              <div className="card rounded-2xl py-16 sm:py-20 text-center">
                <div className="text-4xl mb-4 opacity-40"></div>
                <p className="font-semibold text-sm sm:text-base" style={{ color: 'var(--text)' }}>Tidak Ada Hasil</p>
                <p className="text-xs sm:text-sm mt-2" style={{ color: 'var(--muted)' }}>Coba kata kunci atau filter berbeda</p>
                <button onClick={() => { setQ(''); setKategori('') }} className="mt-5 btn-ghost text-sm py-2 px-5">Reset Filter</button>
              </div>
            ) : (
              <ul className="space-y-2">
                {jobs.map(j => {
                  const cr = companyRatings[j.company_id]
                  return (
                    <li key={j.id}>
                      <Link to={`/lowongan/${j.id}`} className="job-card card p-4 flex items-start sm:items-center gap-3 sm:gap-4 block">
                        <Avatar name={j.companies?.nama} size={36} />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm leading-tight truncate" style={{ color: 'var(--text)' }}>{j.judul}</p>
                          <p className="text-xs sm:text-sm mt-0.5 truncate" style={{ color: 'var(--muted)' }}>
                            {j.companies?.nama}
                            {j.lokasi && <> · <span style={{ color: 'var(--text-secondary)' }}>{j.lokasi}</span></>}
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5 mt-2">
                            {j.kategori && (
                              <span className="badge text-xs" style={{ background: 'var(--tag-bg)', border: '1px solid var(--tag-border)', color: 'var(--tag-text)', fontSize: 11 }}>
                                {j.kategori}
                              </span>
                            )}
                            <span className="badge text-xs" style={{ background: 'var(--tag-bg)', border: '1px solid var(--tag-border)', color: 'var(--muted)', fontSize: 11 }}>
                              Full-time
                            </span>
                            <MiniStars avg={cr?.avg} count={cr?.count} />
                          </div>
                        </div>
                        <div className="shrink-0 text-right flex flex-col items-end gap-1.5">
                          {j.gaji ? (
                            <p className="font-semibold text-xs sm:text-sm whitespace-nowrap" style={{ color: 'var(--text)' }}>
                              Rp {Number(j.gaji).toLocaleString('id-ID')}
                            </p>
                          ) : (
                            <p className="text-xs font-medium italic" style={{ color: 'var(--muted)' }}>Nego</p>
                          )}
                          <span className="hidden sm:inline-block text-xs font-medium px-3 py-1.5 rounded-lg"
                            style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}>
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

      {/* Footer */}
      <footer className="section-divider py-6 sm:py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs font-medium" style={{ color: 'var(--muted)' }}>© 2024 Kerjain. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="text-xs cursor-pointer transition-colors" style={{ color: 'var(--muted)' }}>Tentang</span>
            <span className="text-xs cursor-pointer transition-colors" style={{ color: 'var(--muted)' }}>Kontak</span>
            <span className="text-xs cursor-pointer transition-colors" style={{ color: 'var(--muted)' }}>Privasi</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
