import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

function Avatar({ name, size = 56 }) {
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

export default function JobDetail() {
  const { id } = useParams()
  const { user, profile } = useAuth()
  const [job, setJob] = useState(null)
  const [msg, setMsg] = useState('')
  const [applied, setApplied] = useState(false)

  useEffect(() => {
    supabase.from('jobs').select('*, companies(nama, deskripsi)').eq('id', id).single()
      .then(({ data }) => setJob(data))
  }, [id])

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
        <div className="relative w-12 h-12 mx-auto mb-4">
          <div className="loading-ring" />
        </div>
        <p className="text-neutral-600 text-sm">Memuat detail lowongan...</p>
      </div>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      {/* Back */}
      <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-white mb-8 transition-colors group">
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
              <h1 className="text-xl sm:text-2xl font-bold text-white leading-tight tracking-tight">{job.judul}</h1>
              <p className="text-neutral-500 font-medium mt-1">{job.companies?.nama}</p>
              <div className="flex flex-wrap gap-2 mt-4">
                {job.lokasi && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#737373' }}>
                     {job.lokasi}
                  </span>
                )}
                {job.kategori && (
                  <span className="text-xs font-medium px-3 py-1.5 rounded-lg"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#737373' }}>
                    {job.kategori}
                  </span>
                )}
                <span className="text-xs font-medium px-3 py-1.5 rounded-lg"
                  style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', color: '#10b981' }}>
                  Full-time
                </span>
              </div>
            </div>
            {job.gaji && (
              <div className="shrink-0 text-center sm:text-right">
                <p className="text-xs font-medium text-neutral-600 mb-1">GAJI / BULAN</p>
                <p className="text-xl font-bold" style={{ color: '#10b981' }}>
                  Rp {Number(job.gaji).toLocaleString('id-ID')}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          {/* Deskripsi */}
          <div className="sm:col-span-2 card p-6">
            <h2 className="text-sm font-semibold text-white mb-4">Deskripsi Pekerjaan</h2>
            <div className="text-neutral-500 text-sm leading-7 whitespace-pre-line">
              {job.deskripsi || 'Tidak ada deskripsi tersedia.'}
            </div>
          </div>

          {/* Side panel */}
          <div className="space-y-4">
            {job.companies?.deskripsi && (
              <div className="card p-5">
                <h2 className="text-sm font-semibold text-white mb-3"> {job.companies.nama}</h2>
                <p className="text-neutral-600 text-xs leading-6">{job.companies.deskripsi}</p>
              </div>
            )}

            <div className="card p-5 space-y-3">
              <h2 className="text-sm font-semibold text-white">Info Lowongan</h2>
              {[
                { label: 'Lokasi', value: job.lokasi || '-' },
                { label: 'Kategori', value: job.kategori || '-' },
                { label: 'Gaji', value: job.gaji ? `Rp ${Number(job.gaji).toLocaleString('id-ID')}` : 'Negosiasi' },
                { label: 'Tipe', value: 'Full-time' },
              ].map(i => (
                <div key={i.label} className="flex items-center justify-between">
                  <span className="text-xs text-neutral-600">{i.label}</span>
                  <span className="text-xs font-medium text-neutral-400">{i.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="card p-5">
          {msg && (
            <div className={`flex items-start gap-3 p-4 rounded-xl text-sm font-medium mb-4 ${
              applied ? 'text-emerald-400' : 'text-red-400'
            }`} style={{
              background: applied ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
              border: `1px solid ${applied ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
            }}>
              <span>{applied ? '✓' : '!'}</span>
              <p>{msg}</p>
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-3">
            {!user && (
              <Link to="/login" className="btn-primary flex-1 text-center py-3 text-sm">
                Masuk untuk Melamar
              </Link>
            )}
            {profile?.role === 'pencari_kerja' && (
              <button
                onClick={apply}
                disabled={applied}
                className={`flex-1 font-semibold py-3 rounded-xl text-sm transition-all ${applied ? '' : 'btn-accent'}`}
                style={applied ? { background: '#161616', color: '#525252', border: '1px solid rgba(255,255,255,0.06)', cursor: 'not-allowed' } : {}}
              >
                {applied ? '✓ Sudah Melamar' : 'Lamar Sekarang'}
              </button>
            )}
            <Link to="/" className="btn-ghost flex-1 text-center py-3 text-sm">
              ← Lowongan Lain
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
